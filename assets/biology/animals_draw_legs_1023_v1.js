/* Animals · "Count the legs" canvas (arthropods tab, view 0), 2026-10-23.
 * Six steps (dragonfly, fly, silverfish, spider, crab, snail), pictures from unit 2 (naming_ai_1021/, via AnimalsKit EXT).
 * Each step: the animal large on the left; the program traces every visible leg from where it grows on the body
 *   to its tip (pink line), then a pink number 1, 2, 3 … lights up at the tip, one leg at a time; the counter box in the
 *   right column fills one slot per leg (slots in rows of two = pairs) and ends with a pink total ("3 pairs = 6 legs").
 *   The thorax / cephalothorax is ringed in yellow (evidence: legs grow there); head and abdomen are named in white;
 *   wings are ringed in cyan, "not legs" (dragonfly two pairs, fly one pair, silverfish none).
 *   Legs hidden behind the body (dragonfly, fly: one each) are not drawn on the picture; their slot stays dashed with
 *   "hidden", and a note says "a hidden leg is not a missing leg".
 *   Snail: one muscular foot (yellow outline along the sole, moving waves = schematic), "1 muscular foot, no joints",
 *   "not an arthropod". Yellow evidence label and orange "do not judge only by ___" label under the counter.
 * End: a comparison table (pairs of legs / body parts / group) of all six (continuous play: its own stage after the
 *   snail; holding the snail step: fades in after CONCL seconds).
 * All points were measured once from the PNG alpha/colour (leg paths = least-cost path through opaque pixels from the
 * tip to the measured thorax ellipse; wings = near-white low-saturation regions; regions = moment ellipses).
 */
(()=>{'use strict';
const K=window.AnimalsKit,{P,C,D,text,measure,splitLines,circle,ellipse,glow,line,dashed,stageClock,fade,smooth,mix,clamp,mod,rgba,pic,src,dim,MONO,TAU}=K;
const LB=()=>K.LAB||{};
const L=(k,zh,en)=>LB()[k]||P(zh,en);
const N=6,PER=10,CONCL=7.5,BG='#11261f';
const PINK=C.pink,CYAN=C.cyan,ORANGE=C.orange,YELLOW=C.yellow,FRAME_BG='#16332b';

// ── layout (canvas px) ─────────────────────────────────────────────────────
const MAIN={x:20,y:66,w:580,h:486};
const RX=620,RW=320;
const LEG0=1.3,TR=.4,DLof=n=>Math.min(.55,3.6/n);

// ── labels added by this module (LAB has none for these) ───────────────────
const T={
 insectGrp:P(`節肢動物・昆蟲`,`Arthropod: insect`),
 wings2:P(`兩對翅膀（不算腳）`,`Two pairs of wings (not legs)`),wings1:P(`一對翅膀（不算腳）`,`One pair of wings (not legs)`),noWings:P(`沒有翅膀`,`No wings`),
 tot3:P(`三對＝6 隻`,`3 pairs = 6 legs`),tot4:P(`四對＝8 隻`,`4 pairs = 8 legs`),tot5:P(`五對＝10 隻`,`5 pairs = 10 legs`),
 hidden:P(`被遮住`,`hidden`),hiddenNote:P(`被遮住的腳不能當成沒有`,`A hidden leg is not a missing leg`),
 clawShort:P(`螯足`,`claws`),
 ev0:P(`證據：三對步足都長在胸部`,`Evidence: three pairs of legs, all on the thorax`),
 ev1:P(`證據：三對步足長在胸部`,`Evidence: three pairs of legs on the thorax`),
 ev2:P(`證據：三對步足；頭、胸、腹`,`Evidence: three pairs of legs; head, thorax, abdomen`),
 ev3:P(`證據：四對步足長在頭胸部`,`Evidence: four pairs of legs on the cephalothorax`),
 ev4:P(`證據：五對步足，第一對是螯足`,`Evidence: five pairs of legs, the first pair are claws`),
 ev5:P(`證據：一個肌肉足，沒有關節`,`Evidence: one muscular foot, no joints`),
 no0:P(`翅膀的數目`,`the number of wings`),no1:P(`會不會飛`,`whether it flies`),no2:P(`有沒有翅膀`,`having wings or not`),
 no3:P(`腳多腳少`,`the number of legs`),no4:P(`像不像腳`,`whether it looks like a leg`),no5:P(`有腳、有殼`,`having a foot or a shell`),
 oneFoot:P(`1 個肌肉足`,`1 muscular foot`),notPaired:P(`不成對、沒有關節`,`not in pairs, no joints`),
 footWave:P(`黃色波紋：肌肉收縮（示意）`,`Yellow waves: muscle contractions (schematic)`),
 marks:P(`粉紅點、編號與框線：程式標示（示意）`,`Dots, numbers and outlines: added by code (schematic)`),
 legs:n=>P(`${n} 隻`,n===1?`1 leg`:`${n} legs`),
 tableTitle:P(`比一比：腳的對數與身體分區`,`Compare: pairs of legs and body parts`),
 colAnimal:P(`動物`,`Animal`),colLegs:P(`腳的對數`,`Pairs of legs`),colBody:P(`身體分區`,`Body parts`),colGroup:P(`類群`,`Group`),
 l3:P(`3 對（6 隻）`,`3 pairs (6)`),l4:P(`4 對（8 隻）`,`4 pairs (8)`),l5:P(`5 對（含螯足）`,`5 pairs (with claws)`),l0:P(`沒有（1 個肌肉足）`,`None (1 muscular foot)`),
 bHTA:P(`頭、胸、腹`,`Head, thorax, abdomen`),bCA:P(`頭胸部、腹部`,`Cephalothorax, abdomen`),bNone:P(`不分節`,`Not segmented`),
 tableNote:P(`翅膀不算腳；蝸牛的腳沒有關節，不是節肢動物。`,`Wings are not legs; a snail's foot has no joints, so it is not an arthropod.`)
};

// ── measured from the PNGs (image px) ──────────────────────────────────────
// legs: polyline from the base (on the thorax / cephalothorax) to the tip; listed pair by pair where the pairs are visible.
// ellipses: [cx, cy, semi-axis a, semi-axis b, angle of a (rad)]
const DF={f:'dragonfly.png',view:null,
 legs:[[[201,218],[200,226],[186,240],[178,243],[160,244],[145,234],[122,245]],[[201,218],[197,229],[190,236],[174,245],[165,245],[150,236],[142,236],[137,243],[134,261],[116,280]],[[201,218],[195,238],[201,254],[202,272],[174,295],[171,303],[164,309]],[[203,218],[206,233],[234,257],[234,266],[227,291],[234,316]],[[217,217],[221,224],[257,230],[262,237],[272,270],[289,277],[294,284]]],
 hidden:1,pairs:3,
 main:{e:[213.9,179.5,43.1,34.6,2.331],lab:'thorax',at:[52,132],to:[180,160]},
 named:[{lab:'head',at:[48,196],to:[150,214]},{lab:'abdomen',at:[428,128],to:[402,80]}],
 wings:{ells:[[170.1,73.4,105,28.8,-2.417],[106.5,90.7,123.1,20.3,-2.629],[363.9,191.6,121.6,30,-2.666],[331,251.1,126.9,26.9,-2.408]],p:T.wings2,at:[345,6],maxW:230,to:[[236,100],[360,182]]}};
const FL={f:'fly.png',view:null,
 legs:[[[74,133],[56,135],[30,130]],[[74,142],[58,147],[51,154],[40,199],[35,206],[28,213],[12,220],[5,226]],[[113,177],[112,193],[105,200],[102,209],[94,254],[89,271],[84,278]],[[156,157],[161,162],[170,165],[175,172],[173,208],[180,224],[199,244],[208,247]],[[164,142],[185,147],[203,148],[224,164],[269,165]]],
 hidden:1,pairs:3,
 main:{e:[119.6,132.1,48,44.4,2.451],lab:'thorax',at:[30,40],to:[92,100]},
 named:[{lab:'head',at:[22,82],to:[70,170]},{lab:'abdomen',at:[264,208],to:[214,128]}],
 wings:{ells:[[149.3,49.1,64.1,29,2.373],[242,99.8,59.4,24.9,2.646]],p:T.wings1,at:[262,-14],maxW:230,to:[[180,30],[250,80]]}};
const SF={f:'silverfish.png',view:[60,40,360,290],
 legs:[[[173,181],[152,193],[134,192]],[[217,230],[222,270]],[[190,159],[166,149]],[[248,208],[264,223],[281,245]],[[227,150],[228,127],[231,118],[229,109]],[[254,176],[262,176],[268,181],[271,189],[298,191],[334,198]]],
 hidden:0,pairs:3,
 main:{e:[212.2,190.4,45.5,38.8,-0.632],lab:'thorax',at:[140,82],to:[196,160]},
 named:[{lab:'head',at:[96,226],to:[150,222]},{lab:'abdomen',at:[352,262],to:[300,140]}],
 wings:{ells:[],p:T.noWings,at:[350,300],maxW:230,to:[]}};
const SP={f:'spider.png',view:null,align:'right',
 legs:[[[124,166],[94,139],[84,124],[86,79],[90,52],[99,28],[113,5]],[[194,164],[223,139],[233,124],[227,52],[214,20],[204,5]],[[123,184],[107,181],[83,172],[61,156],[21,98],[13,82],[5,57]],[[196,183],[207,182],[241,169],[255,157],[296,99],[304,83],[311,57]],[[132,200],[128,204],[119,207],[92,209],[75,214],[41,249],[26,272]],[[186,201],[190,205],[226,209],[243,215],[271,243],[291,272]],[[137,205],[80,261],[76,269],[75,332],[99,391]],[[182,205],[190,216],[239,263],[241,272],[241,335],[229,367],[215,390]]],
 hidden:0,pairs:4,
 main:{e:[159.3,176.7,37.3,35.7,-3.093],lab:'cephalothorax',at:[-108,150],to:[124,176]},
 named:[{lab:'abdomen',at:[159,356],to:[159,318]}],wings:null};
const CB={f:'crab.png',view:null,
 legs:[[[136,118],[121,103],[118,95],[118,77],[170,21],[179,19],[197,20]],[[311,115],[324,102],[327,94],[326,67],[277,18],[260,11],[242,11]],[[120,151],[95,136],[76,115],[63,83],[62,74],[64,56],[70,40]],[[328,147],[340,144],[368,118],[372,110],[384,77],[378,41]],[[121,174],[104,173],[87,168],[69,169],[52,174],[28,186],[21,192],[6,215],[4,224]],[[326,176],[334,176],[359,168],[386,170],[418,186],[425,192],[435,206],[441,223]],[[137,203],[133,205],[88,205],[73,216],[49,256],[48,265],[58,299]],[[310,202],[321,207],[357,205],[365,208],[378,222],[398,261],[398,270],[390,296]],[[146,211],[136,224],[115,244],[115,253],[125,296],[145,317],[153,322]],[[278,225],[283,230],[291,233],[325,241],[330,248],[329,266],[322,293],[318,301],[298,321]]],
 hidden:0,pairs:5,
 main:{e:[224.2,158.8,105,78,3.12],lab:'cephalothorax',at:[224,282],to:[224,232]},
 named:[{lab:'claw',at:[64,-30],to:[150,52]}],wings:null};
// snail: bottom edge of the sole (opaque bottom per column, every 16 px) and the shell
const SN={f:'snail.png',view:null,foot:[[8,185],[24,188],[40,188],[56,188],[72,189],[88,186],[104,186],[120,190],[136,189],[152,187],[168,187],[184,188],[200,190],[216,190],[232,190],[248,183],[264,177],[280,162],[296,138],[312,123],[328,123]]};
const STEP=[
 {d:DF,grp:T.insectGrp,name:'dragonfly',ev:T.ev0,no:T.no0,tot:T.tot3},
 {d:FL,grp:T.insectGrp,name:'fly',ev:T.ev1,no:T.no1,tot:T.tot3},
 {d:SF,grp:T.insectGrp,name:'silverfish',ev:T.ev2,no:T.no2,tot:T.tot3},
 {d:SP,grp:['arthropod','節肢動物','Arthropod'],name:'spider',ev:T.ev3,no:T.no3,tot:T.tot4},
 {d:CB,grp:['arthropod','節肢動物','Arthropod'],name:'crab',ev:T.ev4,no:T.no4,tot:T.tot5},
 {d:SN,grp:['mollusc','軟體動物','Mollusc'],name:'snail',ev:T.ev5,no:T.no5,tot:null}];
const NAMES={dragonfly:['蜻蜓','Dragonfly'],fly:['蒼蠅','Fly'],silverfish:['衣魚','Silverfish'],spider:['蜘蛛','Spider'],crab:['蟹','Crab'],snail:['蝸牛','Snail']};
const REG={thorax:['胸部','Thorax'],head:['頭','Head'],abdomen:['腹部','Abdomen'],cephalothorax:['頭胸部','Cephalothorax'],claw:['螯足（第一對）','Claws (first pair)'],muscleFoot:['肌肉足','Muscular foot'],noJoint:['沒有關節的腳','A foot without joints']};
const lab=(k,tbl)=>Array.isArray(k)&&typeof k[0]==='string'&&k.length===3?L(...k):L(k,...tbl[k]);
const nameOf=n=>L(n,...NAMES[n]);
const regOf=n=>L(n,...REG[n]);

// ── text helpers (as in animals_draw_phyla_1023_v1.js) ─────────────────────
const rowsOf=(c,p,w,size=22)=>D.tr(p).split('\n').flatMap(sg=>{let r=splitLines(c,sg,w,size);
  for(let i=1;i<r.length;i++)while(/^[，。、；：！？）」,.;:!?)]/.test(r[i])&&r[i-1].length>1&&/[一-鿿]/.test(r[i-1])){r[i]=r[i-1].slice(-1)+r[i];r[i-1]=r[i-1].slice(0,-1);}
  for(let i=1;i<r.length;i++)while(/^[.,;:!?)]/.test(r[i])&&!/[一-鿿]/.test(r[i-1])){r[i-1]+=r[i][0];r[i]=r[i].slice(1).trimStart();}
  r=r.filter(x=>x);
  for(let i=0;i<r.length-1;i++){const m=r[i].match(/\s*[(（「]$/);if(m&&r[i].length>m[0].length){r[i]=r[i].slice(0,-m[0].length);r[i+1]=m[0].trim()+r[i+1];}}return r;});
// box size of a fitText label (one line if it fits, otherwise wrapped; never shrunk)
function boxSize(c,p,maxW,size=22){const one=measure(c,p,size);let rows,w;
  if(one+28<=maxW&&!D.tr(p).includes('\n')){rows=[D.tr(p)];w=one+28;}else{rows=rowsOf(c,p,maxW-28,size);w=Math.max(...rows.map(r=>measure(c,r,size)))+28;}
  return{rows,w,h:rows.length*(size+7)+11};}
const DBG=(o)=>{if(Array.isArray(window.__LGDBG))window.__LGDBG.push(o);};
function fitText(c,p,x,y,maxW,col,{align='left',active=false,size=22,dashedBorder=false}={}){
  const {rows,w,h}=boxSize(c,p,maxW,size),lh=size+7,bx=align==='center'?x-w/2:align==='right'?x-w:x;
  D.round(c,bx,y,w,h,Math.min(h/2,20),active?col:'rgba(11,26,21,.92)',null);
  c.save();c.beginPath();c.roundRect(bx,y,w,h,Math.min(h/2,20));c.strokeStyle=active?C.white:rgba(col,.85);c.lineWidth=2;if(dashedBorder)c.setLineDash([6,4]);c.stroke();c.restore();
  rows.forEach((r,i)=>text(c,r,bx+w/2,y+5+size*.9+i*lh,size,active?C.deep:col,'center'));
  DBG({s:D.tr(p),x:bx,y,w,h});
  return{x:bx,y,w,h};
}
const lead=(c,x0,y0,x1,y1,col)=>{line(c,[[x0,y0],[x1,y1]],rgba(C.deep,.7),5);line(c,[[x0,y0],[x1,y1]],rgba(col,.95),2);circle(c,x1,y1,4.5,col,C.ink,1.5);};
// lead from the edge of box b to (x, y)
function leadFrom(c,b,x,y,col){const cx=b.x+b.w/2,cy=b.y+b.h/2;let x0=Math.max(b.x+10,Math.min(b.x+b.w-10,x)),y0=Math.max(b.y,Math.min(b.y+b.h,y));
  if(x0>b.x+10&&x0<b.x+b.w-10&&y0>b.y&&y0<b.y+b.h)y0=y<cy?b.y:b.y+b.h;
  if(Math.hypot(x-x0,y-y0)>8)lead(c,x0,y0,x,y,col);}
// pink count marker, 22px number
function count(c,x,y,n,a,r=15,dashedRing=false){if(a<=0)return;if(n>=10)r=Math.max(r,18);c.save();c.globalAlpha*=a;
  if(dashedRing){c.setLineDash([5,4]);circle(c,x,y,r,rgba(PINK,.14),PINK,2.4);c.setLineDash([]);}
  else{circle(c,x,y,r+3,rgba(C.deep,.7),null);circle(c,x,y,r,PINK,C.ink,2);}
  c.font=MONO(22);c.fillStyle=dashedRing?PINK:C.ink;c.textAlign='center';c.textBaseline='middle';c.fillText(String(n),x,y+1);c.restore();}
function dEll(c,e,M,k,col,t,a,fillA=.08){if(a<=0)return;const [x,y]=M(e[0],e[1]);c.save();c.globalAlpha*=a;
  ellipse(c,x,y,e[2]*k,e[3]*k,rgba(col,fillA),rgba(C.deep,.75),6,e[4]);
  c.setLineDash([8,6]);c.lineDashOffset=-t*14;ellipse(c,x,y,e[2]*k,e[3]*k,null,col,2.8,e[4]);c.restore();}
// a polyline drawn up to fraction u of its length
function partial(pts,u){if(u>=1)return pts;let L0=0;const seg=[];for(let i=1;i<pts.length;i++){const l=Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]);seg.push(l);L0+=l;}
  let want=L0*clamp(u);const out=[pts[0]];for(let i=1;i<pts.length;i++){if(want>=seg[i-1]){out.push(pts[i]);want-=seg[i-1];}else{const q=want/seg[i-1];out.push([mix(pts[i-1][0],pts[i][0],q),mix(pts[i-1][1],pts[i][1],q)]);break;}}return out;}

// ── picture placement: view window [vx,vy,vw,vh] (image px) fitted into MAIN ─
function placeOf(d){const [W,H]=dim(d.f),v=d.view||[0,0,W,H],k=Math.min(MAIN.w/v[2],MAIN.h/v[3]),w=v[2]*k,h=v[3]*k;
  const ox=d.align==='right'?MAIN.x+MAIN.w-w:MAIN.x+(MAIN.w-w)/2,oy=MAIN.y+(MAIN.h-h)/2;
  return{k,X0:ox-v[0]*k,Y0:oy-v[1]*k,win:{x:ox,y:oy,w,h},v,W,H};}
function drawPic(c,d,pl,dy){const im=pic(src(d.f)),{k,X0,Y0,win,W,H,v}=pl;
  c.save();if(d.view){c.beginPath();c.rect(win.x,win.y+dy,win.w,win.h);c.clip();}
  if(im)c.drawImage(im,X0,Y0+dy,W*k,H*k);else{c.setLineDash([6,6]);D.round(c,win.x,win.y,win.w,win.h,10,null,rgba(C.muted,.4));}
  c.restore();
  if(d.view){// soft edges where the window cuts the picture
    const F=36,edges=[[v[0]>0,'l'],[v[1]>0,'t'],[v[0]+v[2]<W,'r'],[v[1]+v[3]<H,'b']];
    for(const [on,s] of edges){if(!on)continue;const x=win.x,y=win.y+dy,w=win.w,h=win.h;let g;
      if(s==='l'){g=c.createLinearGradient(x,0,x+F,0);}else if(s==='r'){g=c.createLinearGradient(x+w,0,x+w-F,0);}else if(s==='t'){g=c.createLinearGradient(0,y,0,y+F);}else{g=c.createLinearGradient(0,y+h,0,y+h-F);}
      g.addColorStop(0,rgba(BG,1));g.addColorStop(1,rgba(BG,0));c.fillStyle=g;
      if(s==='l')c.fillRect(x-1,y-1,F+1,h+2);else if(s==='r')c.fillRect(x+w-F,y-1,F+1,h+2);else if(s==='t')c.fillRect(x-1,y-1,w+2,F+1);else c.fillRect(x-1,y+h-F,w+2,F+1);}}
  DBG({pic:d.f,X0,Y0:Y0+dy,k,win:{...win,y:win.y+dy}});
}

// ── header ─────────────────────────────────────────────────────────────────
function header(c,k){const S=STEP[k],g=Array.isArray(S.grp)&&S.grp.length===3?L(...S.grp):S.grp;
  const pl=fitText(c,g,20,12,420,CYAN,{active:true});
  const n=nameOf(S.name);text(c,n,pl.x+pl.w+14,pl.y+pl.h/2+9,26,C.white);
  return{pl,nx:pl.x+pl.w+14+measure(c,n,26)};}

// ── right column ───────────────────────────────────────────────────────────
// counter box: one slot per leg, rows of two (= pairs); returns the box
function counter(c,S,tau,t){
  const d=S.d,vis=d.legs.length,nAll=d.pairs*2,top=72,rowH=38,h=64+d.pairs*rowH-4;
  c.save();c.beginPath();c.roundRect(RX,top,RW,h,16);c.fillStyle=FRAME_BG;c.fill();c.strokeStyle=rgba(PINK,.6);c.lineWidth=2;c.stroke();c.restore();
  text(c,L('count','數量','Count'),RX+16,top+34,22,C.white);
  const DL=DLof(vis);let lit=0;for(let i=0;i<vis;i++)if(tau>=LEG0+i*DL+TR)lit=i+1;
  const done=LEG0+(vis-1)*DL+TR,hidOn=fade(tau,done+.5,.4);
  text(c,T.legs(lit),RX+RW-18,top+36,28,PINK,'right');
  for(let j=0;j<nAll;j++){const row=j>>1,x=RX+40+(j%2)*44,y=top+64+row*rowH;
    circle(c,x,y,15,null,rgba(PINK,.35),2);
    if(j<vis){const a=fade(tau,LEG0+j*DL+TR,.25);if(a>0)count(c,x,y,j+1,a);}
    else{count(c,x,y,j+1,hidOn,15,true);}
  }
  for(let r=0;r<d.pairs;r++){const y=top+64+r*rowH;
    if(r===0&&S.name==='crab'){c.save();c.globalAlpha*=fade(tau,LEG0+DL+TR,.4);text(c,T.clawShort,RX+120,y+8,22,C.white);c.restore();}
    const hidRow=(r*2+1)>=vis&&(r*2+1)<nAll;if(hidRow){c.save();c.globalAlpha*=hidOn;text(c,T.hidden,RX+120,y+8,22,PINK);c.restore();}}
  DBG({s:'counter',x:RX,y:top,w:RW,h});
  return{x:RX,y:top,w:RW,h,done};
}
function rightColumn(c,k,tau,t){const S=STEP[k];let y;
  if(S.d.legs){const b=counter(c,S,tau,t);y=b.y+b.h+14;
    const at=b.done+.3;c.save();c.globalAlpha*=fade(tau,at,.4);const tp=fitText(c,S.tot,RX,y,RW,PINK,{active:true});c.restore();y=tp.y+tp.h+12;
    if(S.d.hidden){c.save();c.globalAlpha*=fade(tau,b.done+.5,.4);const hp=fitText(c,T.hiddenNote,RX,y,RW,PINK,{dashedBorder:true});c.restore();y=hp.y+hp.h+12;}
    var t0=b.done+1;}
  else{const top=72,h=112;c.save();c.beginPath();c.roundRect(RX,top,RW,h,16);c.fillStyle=FRAME_BG;c.fill();c.strokeStyle=rgba(PINK,.6);c.lineWidth=2;c.stroke();c.restore();
    text(c,L('count','數量','Count'),RX+16,top+34,22,C.white);
    count(c,RX+40,top+74,1,fade(tau,1.6,.3));
    c.save();c.globalAlpha*=fade(tau,1.8,.4);text(c,T.oneFoot,RX+68,top+82,22,PINK);c.restore();
    c.save();c.globalAlpha*=fade(tau,2.6,.4);const np=fitText(c,T.notPaired,RX,top+h+14,RW,PINK,{active:true});c.restore();
    y=np.y+np.h+12;var t0=3.2;}
  c.save();c.globalAlpha*=fade(tau,t0,.5);const ev=fitText(c,S.ev,RX,y,RW,YELLOW);c.restore();
  const no=L('notOnly','不能只看','Do not judge only by');
  c.save();c.globalAlpha*=fade(tau,t0+.8,.5);const nb=fitText(c,P(`${no[0]}「${S.no[0]}」`,`${no[1]} ${S.no[1]}`),RX,ev.y+ev.h+12,RW,ORANGE);c.restore();
  if(!S.d.legs){c.save();c.globalAlpha*=fade(tau,1.6,.5);rowsOf(c,T.footWave,RW).forEach((r,j)=>text(c,r,RX,nb.y+nb.h+36+j*30,22,C.muted));c.restore();}
}

// ── one arthropod step ─────────────────────────────────────────────────────
const bob=t=>3*Math.sin(t*1.2);
function arthropod(c,k,tau,t){
  const S=STEP[k],d=S.d,pl=placeOf(d),dy=bob(t),M=(ix,iy)=>[pl.X0+ix*pl.k,pl.Y0+iy*pl.k+dy],DL=DLof(d.legs.length);
  drawPic(c,d,pl,dy);
  // body region where the legs grow (yellow) and the other named parts (white)
  const ra=fade(tau,.6,.5);
  dEll(c,d.main.e,M,pl.k,YELLOW,t,ra);
  const placeLab=(o,col,a)=>{if(a<=0)return;c.save();c.globalAlpha*=a;const p=regOf(o.lab),[ax,ay]=M(...o.at),bs=boxSize(c,p,o.maxW||300);
    const bx=Math.max(20,Math.min(600-bs.w,ax-bs.w/2)),by=Math.max(60,ay-bs.h/2);const b=fitText(c,p,bx,by,o.maxW||300,col);const [tx,ty]=M(...o.to);leadFrom(c,b,tx,ty,col);c.restore();};
  placeLab(d.main,YELLOW,ra);
  d.named.forEach((o,i)=>placeLab(o,C.white,fade(tau,.9+i*.2,.5)));
  // legs: trace from the base to the tip, then the number at the tip
  d.legs.forEach((pts,i)=>{const t0=LEG0+i*DL,u=smooth(clamp((tau-t0)/TR));if(u<=0)return;
    const P0=pts.map(p=>M(...p)),pp=partial(P0,u);
    c.save();c.lineCap='round';c.lineJoin='round';
    c.beginPath();pp.forEach((p,j)=>j?c.lineTo(...p):c.moveTo(...p));c.strokeStyle=rgba(C.deep,.65);c.lineWidth=7;c.stroke();
    c.beginPath();pp.forEach((p,j)=>j?c.lineTo(...p):c.moveTo(...p));c.strokeStyle=rgba(PINK,.95);c.lineWidth=3.2;c.stroke();c.restore();
    circle(c,P0[0][0],P0[0][1],5,PINK,C.ink,1.5);
    const a=fade(tau,t0+TR,.25);if(a>0){const tip=P0.at(-1);if(tau-t0-TR<1.2){c.save();c.globalAlpha*=a;K.pulse(c,tip[0],tip[1],t*1.6,PINK,15);c.restore();}count(c,tip[0],tip[1],i+1,a);}
  });
  // wings: cyan, "not legs"
  const done=LEG0+(d.legs.length-1)*DL+TR;
  if(d.wings){const wa=fade(tau,done+.2,.5);
    d.wings.ells.forEach(e=>dEll(c,e,M,pl.k,CYAN,t,wa,.06));
    if(wa>0){c.save();c.globalAlpha*=wa;const [ax,ay]=M(...d.wings.at),bs=boxSize(c,d.wings.p,d.wings.maxW);
      const b=fitText(c,d.wings.p,Math.max(20,Math.min(600-bs.w,ax-bs.w/2)),Math.max(60,ay),d.wings.maxW,CYAN);
      d.wings.to.forEach(p=>{const [tx,ty]=M(...p);leadFrom(c,b,tx,ty,CYAN);});c.restore();}}
}

// ── snail step ─────────────────────────────────────────────────────────────
function snail(c,tau,t){
  const d=SN,pl=placeOf(d),dy=bob(t),M=(ix,iy)=>[pl.X0+ix*pl.k,pl.Y0+iy*pl.k+dy];
  drawPic(c,d,pl,dy);
  const fa=fade(tau,.8,.6);
  if(fa>0){const F=d.foot.map(p=>M(p[0],p[1]-3));c.save();c.globalAlpha*=fa;c.lineCap='round';c.lineJoin='round';
    c.beginPath();F.forEach((p,j)=>j?c.lineTo(...p):c.moveTo(...p));c.strokeStyle=rgba(C.deep,.7);c.lineWidth=9;c.stroke();
    c.setLineDash([10,7]);c.lineDashOffset=-t*16;c.beginPath();F.forEach((p,j)=>j?c.lineTo(...p):c.moveTo(...p));c.strokeStyle=YELLOW;c.lineWidth=4;c.stroke();c.restore();
    // muscle waves along the sole (schematic): bumps travelling from the tail toward the head
    c.save();c.globalAlpha*=fa*.9;for(let w=0;w<4;w++){const q=mod(t*.18+w/4),i=Math.min(F.length-2,Math.floor(q*(F.length-1))),u=q*(F.length-1)-i,
      x=mix(F[i][0],F[i+1][0],u),y=mix(F[i][1],F[i+1][1],u);ellipse(c,x,y-7,13,6,rgba(YELLOW,.55),null);}c.restore();}
  // marker "1" on the foot
  const [mx,my]=M(150,170);count(c,mx,my,1,fade(tau,1.6,.3));
  c.save();c.globalAlpha*=fade(tau,1.2,.5);
  const fp=P(`${regOf('muscleFoot')[0]}（${regOf('noJoint')[0]}）`,`${regOf('muscleFoot')[1]} (${regOf('noJoint')[1].toLowerCase()})`);
  const [fx,fy]=M(100,190),b=fitText(c,fp,40,fy+38,560,YELLOW);leadFrom(c,b,fx,fy,YELLOW);c.restore();
}

// ── closing table ──────────────────────────────────────────────────────────
const TBL=[['dragonfly','dragonfly.png',T.l3,T.bHTA,T.insectGrp],['fly','fly.png',T.l3,T.bHTA,T.insectGrp],['silverfish','silverfish.png',T.l3,T.bHTA,T.insectGrp],
 ['spider','spider.png',T.l4,T.bCA,['arthropod','節肢動物','Arthropod']],['crab','crab.png',T.l5,T.bCA,['arthropod','節肢動物','Arthropod']],['snail','snail.png',T.l0,T.bNone,['mollusc','軟體動物','Mollusc']]];
const COLS=[[20,210],[230,250],[480,240],[720,220]];
function table(c,a,tau,t){if(a<=0)return;c.save();c.globalAlpha*=a;
  text(c,T.tableTitle,20,46,30,YELLOW);
  const y0=66,hh=46,rh=64;
  D.round(c,20,y0,920,hh+6*rh+8,16,'rgba(11,26,21,.92)',null);
  c.save();c.beginPath();c.roundRect(20,y0,920,hh+6*rh+8,16);c.strokeStyle=rgba(C.edge,1);c.lineWidth=2;c.stroke();c.restore();
  [T.colAnimal,T.colLegs,T.colBody,T.colGroup].forEach((p,i)=>text(c,p,COLS[i][0]+14,y0+32,22,C.muted));
  line(c,[[30,y0+hh],[930,y0+hh]],rgba(C.edge,1),2);
  const sweep=mod(t*.5,4);
  TBL.forEach((r,i)=>{const ra=fade(tau,.3+i*.25,.4);if(ra<=0)return;const y=y0+hh+4+i*rh;c.save();c.globalAlpha*=ra;
    if(i===5){D.round(c,24,y+2,912,rh-4,10,rgba(ORANGE,.08),null);}
    const hl=Math.max(0,1-Math.abs(sweep*1.5-i));if(hl>0){D.round(c,24,y+2,912,rh-4,10,rgba(CYAN,.16*hl),null);}
    if(i)line(c,[[30,y],[930,y]],rgba(C.edge,.6),1);
    K.place(c,r[1],COLS[0][0]+8,y+6+2.5*Math.sin(t*1.6+i*.9),62,rh-12);
    text(c,nameOf(r[0]),COLS[0][0]+78,y+rh/2+8,22,C.white);
    const cell=(p,ci,col)=>{const rows=rowsOf(c,p,COLS[ci][1]-24);const lh=27,yy=y+rh/2+8-(rows.length-1)*lh/2;rows.forEach((s,j)=>text(c,s,COLS[ci][0]+14,yy+j*lh,22,col));};
    cell(r[2],1,PINK);cell(r[3],2,C.white);cell(Array.isArray(r[4])&&r[4].length===3?L(...r[4]):r[4],3,CYAN);
    c.restore();});
  c.save();c.globalAlpha*=fade(tau,2,.5);rowsOf(c,T.tableNote,900).forEach((s,j)=>text(c,s,480,y0+hh+6*rh+46+j*30,22,C.white,'center'));c.restore();
  c.restore();}

// ── one stage's whole picture ──────────────────────────────────────────────
function scene(c,k,tau,t,a){
  if(a<=0)return;c.save();c.globalAlpha*=a;
  if(k===6){table(c,1,tau,t);c.restore();return;}
  const cq=k===5&&HELD.v?clamp((tau-CONCL)/1.2):0,ca=smooth(clamp(cq*2-1));
  if(cq<.5){c.save();c.globalAlpha*=1-smooth(cq*2);
    if(k===5)snail(c,tau,t);else arthropod(c,k,tau,t);
    const h=header(c,k);
    if(k===5){c.save();c.globalAlpha*=fade(tau,3.6,.5);const np=L('notArthropod','不是節肢動物','Not an arthropod');const bs=boxSize(c,np,300);if(h.nx+16+bs.w<=940)fitText(c,np,h.nx+16,12,300,CYAN,{dashedBorder:true});else fitText(c,np,600-bs.w,62,300,CYAN,{dashedBorder:true});c.restore();}
    rightColumn(c,k,tau,t);
    text(c,T.marks,20,588,22,C.muted);
    c.restore();}
  if(cq<.5)text(c,L('aiNote','AI 插圖，非實拍','AI illustration, not a photo'),940,40,22,C.muted,'right');
  if(ca>0)table(c,ca,tau-CONCL-.6,t);
  c.restore();
}
const HELD={v:false};

function draw(c,s,t){
  const held=s.phase>=0,clk=held?stageClock(s,t,N,PER):stageClock(s,t,N+1,PER),{k,tau}=clk;
  HELD.v=held;
  s.shown=Math.min(k,5);
  const st=s.lg||(s.lg={});
  if(st.k===undefined||st.held!==held){st.k=k;st.from=-1;st.T=t-9;st.held=held;}
  if(st.k!==k){st.from=st.k;st.fromTau=st.tau;st.k=k;st.T=t;}
  if(t<st.T)st.T=t;
  st.tau=tau;
  const x=clamp((t-st.T)/.9),aOut=1-smooth(clamp(x*2)),aIn=smooth(clamp(x*2-1)),cross=st.from>=0&&x<1;
  if(cross)scene(c,st.from,st.fromTau+(t-st.T),t,aOut);
  scene(c,k,tau,t,cross?aIn:1);
}
window.AnimalsDraw.legs=draw;
})();
