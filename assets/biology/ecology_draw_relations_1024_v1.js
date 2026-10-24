/* Ecology lesson 3 · "relations" canvas (symbiosis tab, view 3), 2026-10-24. Five relationships side by side: the closing view.
 * One table row per relationship, added one per step and kept (cumulative): predation, competition, mutualism, commensalism,
 * parasitism. Each row: relationship name + its sign pair, one small picture, the two organisms each with its own sign disc
 * (+ green, − orange, 0 faded grey-white) and the effect word next to it, and one short note. No food-chain arrow, no eaten/eater
 * arrow, no energy (lesson 2). 0 only means "no evident effect in this situation".
 * Pictures (K.SIZE, measured with PIL): EC13_mantis_grasshopper 692x1280 (crop y 180..780: mantis head + held grasshopper,
 * bottom 90 px fade out), EC9_beetles_sap 1400x1167 (crop y 230..1110, top and bottom 60 px fade out), EC10_clownfish_anemone
 * 1111x1091, EC24_remora_shark 1400x523, EC12_dodder 1125x1204 (top and bottom 40 px fade out, host stem is cut flat).
 * Cleanup (PIL test, once per picture, like compete / commens / parasite): (1) near-white background left on the cut-out
 * (min RGB > 225, max-min < 22) connected to transparency -> transparent (dodder 29.4k px, EC10 10.5k); (2) 2 px into light
 * low-saturation pixels (lum > 150, max-min < 70) next to transparency -> transparent (pale rim); (3) EC10 only: pale blue-white
 * pockets between the tentacles (min RGB > 185, B >= R, G >= R-4, max-min < 45; 37.7k px) outside the clownfish polygon FISH
 * (from the mutual module) are treated as transparency too. The cleaned, cropped picture is pre-scaled once (3x its box).
 * Layout (960x600): rows y 6 / 104 / 252 / 350 / 448, height 92, x 48..944. Columns: name + sign pair 58..246, picture box
 * 252..368 x 84, organisms 392..710 (disc centre 392, text from 414), note 722..936. Between rows 2 and 3 (y 200..244):
 * the "Symbiosis: living together over time" tab (right) on top of a dashed cyan frame around rows 3-5; predation and
 * competition stay outside it. Left gutter (x 22): the predation-parasitism connector (step 4 only).
 * Five steps, 8 s each; s.shown = step. Row i lives in steps i..4. The new row slides in from the right and is highlighted
 * (yellow breathing border, pulsing sign pair, rippling discs, breathing picture); earlier rows stay, small and clear;
 * rows still to come are faint dashed outlines.
 *  0 predation: mantis +, grasshopper −; note "The predator eats the prey".
 *  1 competition: rhinoceros beetle −, stag beetle −; note "− is compared with having no rival".
 *  2 mutualism: clownfish +, sea anemone +; the symbiosis frame and tab appear (rows 3-5, two still empty).
 *  3 commensalism: remora +, shark 0 ("0 No evident effect"); note "0 only means no evident effect here".
 *  4 parasitism: dodder +, host −; note "The parasite depends on a host over time"; then the gutter connector joins the
 *    predation and parasitism rows, both sign pairs glow, pill "Predation, parasitism: same + / −, different process".
 * Sign legend pill fixed at the bottom left; AI note bottom right.
 * Labels from K.LAB; new labels defined here as P() (see NEW).
 */
(()=>{'use strict';
const K=window.EcologyKit,{P,C,D,clamp,mix,mod,smooth,ease,rgba,text,measure,glow,circle}=K;
const L=(k,zh,en)=>(K.LAB&&K.LAB[k])||P(zh,en);
if(!K.SIZE['EC24_remora_shark.png'])K.SIZE['EC24_remora_shark.png']=[1400,523];
// new labels and sentences (not in K.LAB)
const NEW={
  notePred:P('掠食者吃掉獵物','The predator eats the prey'),
  noteComp:P('− 是和沒有對手時比','− is compared with having no rival'),
  noteMutu:P('雙方都得益','Both sides gain'),
  noteComm:P('0 只代表這個情境\n看不出明顯影響','0 only means no evident effect here'),
  notePara:P('寄生者長時間\n依賴寄主','The parasite depends on a host over time'),
  same:P('掠食、寄生同為＋／−，差在過程','Same + / −, different process')
};
const N=5,PER=8,CW=960,MOVE=.8;
const WHITE=C.white,YELLOW=C.yellow,CYAN=C.cyan,GREEN=C.green,ORANGE=C.orange,MUTED=C.muted;

// ── pictures: crop [x,y,w,h] in picture px, fade [top,bottom] px ──
const FISH=[[212,358],[300,362],[385,318],[470,300],[570,286],[600,270],[685,286],[705,338],[785,366],[835,405],[855,460],[835,505],[765,535],[690,562],[668,605],[600,620],[555,585],[470,565],[380,560],[298,520],[212,520]];
const PIC=[
  {f:'EC13_mantis_grasshopper.png',crop:[0,180,692,600],fade:[0,90]},
  {f:'EC9_beetles_sap.png',crop:[0,230,1400,880],fade:[60,60]},
  {f:'EC10_clownfish_anemone.png',pockets:true},
  {f:'EC24_remora_shark.png'},
  {f:'EC12_dodder.png',fade:[40,40]}];

// ── layout ────────────────────────────────────────────────────────────────
const RY=[6,104,252,350,448],RH=92,RX=48,RW=896,XN=58,PB={x:252,w:116,h:84},XD=392,XT=414,XNOTE=722,WNOTE=214;
const FRAME={x:38,y:224,w:916,h:322},GX=22,TABY=204,LEGY=556;
PIC.forEach(p=>{const [W,H]=K.SIZE[p.f],cr=p.crop||[0,0,W,H];p.cw=cr[2];p.ch=cr[3];
  const k=Math.min(PB.w/cr[2],PB.h/cr[3]);p.w=cr[2]*k;p.h=cr[3]*k;});
// organisms: [label key, zh, en, sign]  sign: 1 = +, -1 = −, 0 = 0
const ROWS=[
  {rel:['predation','掠食','Predation'],a:['mantis','螳螂','Mantis',1],b:['grasshopper','蚱蜢','Grasshopper',-1],note:NEW.notePred},
  {rel:['competition','競爭','Competition'],a:['rhinoBeetle','獨角仙','Rhinoceros beetle',-1],b:['stagBeetle','鍬形蟲','Stag beetle',-1],note:NEW.noteComp},
  {rel:['mutualism','互利共生','Mutualism'],a:['clownfish','小丑魚','Clownfish',1],b:['anemone','海葵','Sea anemone',1],note:NEW.noteMutu},
  {rel:['commensalism','片利共生','Commensalism'],a:['remora','鮣魚','Remora',1],b:['shark','鯊魚','Shark',0],note:NEW.noteComm},
  {rel:['parasitism','寄生','Parasitism'],a:['dodder','菟絲子','Dodder',1],b:['host','寄主','Host',-1],note:NEW.notePara}];

// ── picture cleanup (once per picture), crop, fades, pre-scale ──
const CLEAN={};
function cleaned(p){
  if(CLEAN[p.f])return CLEAN[p.f];const im=K.pic(K.src(p.f));if(!im)return null;
  try{const W=im.naturalWidth,H=im.naturalHeight,n=W*H,cv=document.createElement('canvas');cv.width=W;cv.height=H;const g=cv.getContext('2d');g.drawImage(im,0,0);
    const d=g.getImageData(0,0,W,H),a=d.data,dep=new Uint8Array(n).fill(255),q=new Int32Array(n);let h=0,e=0,cnt=0;
    let prot=null;
    if(p.pockets){const mc=document.createElement('canvas');mc.width=W;mc.height=H;const mg=mc.getContext('2d');mg.beginPath();FISH.forEach((v,i)=>i?mg.lineTo(...v):mg.moveTo(...v));mg.closePath();mg.fillStyle='#fff';mg.fill();prot=mg.getImageData(0,0,W,H).data;}
    const bgw=new Uint8Array(n),light=new Uint8Array(n);
    for(let i=0;i<n;i++){const j=i*4,r=a[j],gg=a[j+1],b=a[j+2];if(a[j+3]<20){dep[i]=0;q[e++]=i;continue;}
      const mx=Math.max(r,gg,b),mn=Math.min(r,gg,b);
      if(mn>225&&mx-mn<22)bgw[i]=1;if((r+gg+b)/3>150&&mx-mn<70)light[i]=1;
      if(prot&&mn>185&&b>=r&&gg>=r-4&&mx-mn<45&&prot[j]<128){dep[i]=0;q[e++]=i;cnt++;}}
    while(h<e){const i=q[h++],dd=dep[i],x=i%W;
      for(const k of [x>0?i-1:-1,x<W-1?i+1:-1,i-W,i+W]){if(k<0||k>=n||dep[k]!==255)continue;
        if(bgw[k]){dep[k]=0;q[e++]=k;cnt++;}else if(dd<2&&light[k]){dep[k]=dd+1;q[e++]=k;cnt++;}}}
    for(let i=0;i<n;i++)if(dep[i]<255)a[i*4+3]=0;
    g.putImageData(d,0,0);
    const cr=p.crop||[0,0,W,H],fc=document.createElement('canvas');fc.width=cr[2];fc.height=cr[3];const fg=fc.getContext('2d');fg.drawImage(cv,cr[0],cr[1],cr[2],cr[3],0,0,cr[2],cr[3]);
    if(p.fade){fg.save();fg.globalCompositeOperation='destination-out';const [ft,fb]=p.fade,Hc=cr[3];
      if(ft){const gr=fg.createLinearGradient(0,0,0,ft);gr.addColorStop(0,'rgba(0,0,0,1)');gr.addColorStop(1,'rgba(0,0,0,0)');fg.fillStyle=gr;fg.fillRect(0,0,cr[2],ft);}
      if(fb){const gr=fg.createLinearGradient(0,Hc-fb,0,Hc);gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(1,'rgba(0,0,0,1)');fg.fillStyle=gr;fg.fillRect(0,Hc-fb,cr[2],fb);}
      fg.restore();}
    // pre-scale in halving steps to 3x the box size (smooth thumbnail)
    let src=fc;const tw=Math.round(p.w*3),th=Math.round(p.h*3);
    while(src.width/2>tw){const hc=document.createElement('canvas');hc.width=Math.round(src.width/2);hc.height=Math.round(src.height/2);const hg=hc.getContext('2d');hg.imageSmoothingQuality='high';hg.drawImage(src,0,0,hc.width,hc.height);src=hc;}
    const oc=document.createElement('canvas');oc.width=tw;oc.height=th;const og=oc.getContext('2d');og.imageSmoothingQuality='high';og.drawImage(src,0,0,tw,th);
    CLEAN[p.f]=oc;draw.cleanStats=Object.assign(draw.cleanStats||{},{[p.f]:cnt});}catch(err){CLEAN[p.f]='raw';}
  return CLEAN[p.f];
}
function picIn(c,p,r){
  const cv=cleaned(p);
  if(!cv){c.save();c.setLineDash([6,6]);D.round(c,r.x,r.y,r.w,r.h,10,null,rgba(MUTED,.4));c.restore();return;}
  c.save();c.imageSmoothingQuality='high';
  if(cv==='raw'){const im=K.pic(K.src(p.f)),[W,H]=K.SIZE[p.f],cr=p.crop||[0,0,W,H];c.drawImage(im,cr[0],cr[1],cr[2],cr[3],r.x,r.y,r.w,r.h);}
  else c.drawImage(cv,r.x,r.y,r.w,r.h);
  c.restore();
}

// ── helpers ───────────────────────────────────────────────────────────────
const withA=(c,a,fn)=>{if(a<=0.002)return;c.save();c.globalAlpha*=Math.min(1,a);fn();c.restore();};
function tag(c,p,x,y,{al='left',col=WHITE,active=false,size=22,fill='rgba(11,26,21,.94)',minX=8,maxX=CW-8}={}){
  const w=measure(c,p,size)+28,h=size+18,bx=Math.max(minX,Math.min(maxX-w,al==='right'?x-w:al==='center'?x-w/2:x));
  D.round(c,bx,y,w,h,h/2,active?col:fill,active?WHITE:rgba(col,.9));
  text(c,p,bx+w/2,y+h/2+size*.36,size,active?C.deep:col,'center');
  return{x:bx,y,w,h};
}
function pulseRing(c,p,t,col=YELLOW){const u=mod(t*.7);D.round(c,p.x-6*u,p.y-6*u,p.w+12*u,p.h+12*u,p.h/2+6*u,null,rgba(col,.8*(1-u)));}
const SCOL=sg=>sg>0?GREEN:sg<0?ORANGE:WHITE;
// sign disc: + / − drawn as bars, 0 as a faded ring; ripple only when `live`
function disc(c,x,y,r,sg,t,pop,live){
  const rr=r*(.4+.6*ease(pop)),bt=Math.max(4,rr*.22),bw=rr*1.0;
  if(sg===0){const br=.55+.08*Math.sin(t*1.7);
    circle(c,x,y,rr,'rgba(11,26,21,.9)',rgba(WHITE,.4*br+.14),3);
    if(live){c.save();c.setLineDash([4,4]);c.lineDashOffset=-t*4;circle(c,x,y,rr+5,null,rgba(WHITE,.2+.12*Math.sin(t*1.7)),2);c.restore();}
    K.ellipse(c,x,y,rr*.32,rr*.5,null,rgba(WHITE,.55*br+.2),Math.max(3,rr*.17));return;}
  const col=SCOL(sg),sc=live?1+.04*Math.sin(t*2.6):1;const R=rr*sc;
  if(live){glow(c,x,y,R*1.8,col,.25);const u=mod(t*.55);circle(c,x,y,R+3+u*8,null,rgba(col,.6*(1-u)),2.5);}
  circle(c,x,y,R,'rgba(11,26,21,.92)',col,3.5);
  c.save();c.fillStyle=col;c.beginPath();c.roundRect(x-bw*sc/2,y-bt/2,bw*sc,bt,bt/2);if(sg>0)c.roundRect(x-bt/2,y-bw*sc/2,bt,bw*sc,bt/2);c.fill();c.restore();
}
const effect=sg=>{if(sg>0)return L('gain','得益','Gains');if(sg<0)return L('loss','受害','Harmed');const ne=L('noEffect','看不出明顯影響','No evident effect');return P('0 '+ne[0],'0 '+ne[1]);};
// the sign pair "+ / −" drawn as shapes in colour (same shapes as the discs), returns its box
function glyph(c,x,y,sg,sz){
  if(sg===0){K.ellipse(c,x,y,sz*.3,sz*.5,null,rgba(WHITE,.75),4);return;}
  const col=SCOL(sg),bt=5;c.save();c.fillStyle=col;c.beginPath();c.roundRect(x-sz/2,y-bt/2,sz,bt,bt/2);if(sg>0)c.roundRect(x-bt/2,y-sz/2,bt,sz,bt/2);c.fill();c.restore();
}
function signPair(c,x,cy,sa,sb,glowA=0,t=0){
  const sz=22,w=96;
  if(glowA>0)D.round(c,x-8,cy-20,w+16,40,10,rgba(YELLOW,.10*glowA),rgba(YELLOW,(.55+.35*Math.sin(t*3))*glowA));
  glyph(c,x+14,cy,sa,sz);K.sline(c,[[x+54,cy-13],[x+42,cy+13]],rgba(WHITE,.55),3);glyph(c,x+82,cy,sb,sz);
  return{x,y:cy-14,w,h:28};
}
// note: zh lines are given with \n (each line kept whole), en lines wrap
function note(c,p,x,yc,w,col){
  const str=D.tr(p),parts=str.split('\n'),rows=[];parts.forEach(q=>rows.push(...K.splitLines(c,q,w,22)));
  const lh=28,y0=yc-rows.length*lh/2+20;rows.forEach((r,i)=>text(c,P(r,r),x,y0+i*lh,22,col));
}

// ── frame ─────────────────────────────────────────────────────────────────
function draw(c,s,t){
  const {k}=K.stageClock(s,t,N,PER);
  s.shown=k;
  const st=s.relSt||(s.relSt={});
  if(st.k===undefined){st.k=k;st.from=-1;st.T=t-9;}
  if(st.k!==k){st.from=st.k;st.k=k;st.T=t;}
  if(t<st.T){st.T=t;st.from=-1;}
  st.lastT=t;
  const tau=t-st.T,x=clamp(tau/MOVE),moving=st.from>=0&&x<1,u=moving?smooth(x):1;
  // A(steps, delay): alpha of an element living in the listed steps; fades in after `delay` when it was not there before
  const A=(steps,d)=>{const inK=steps.includes(k),inF=st.from>=0&&steps.includes(st.from);
    const now=!inK?0:inF?1:ease((tau-d)/.7);
    if(!moving)return now;const was=inF?1:0;return now>=was?now:mix(was,now,u);};
  const fromRows=st.from>=0?st.from:-1;                               // rows 0..from were already there
  const isNew=i=>i===k&&i>fromRows;
  const pop=(i,d)=>isNew(i)?clamp((tau-d)/.6):1;
  const range=i=>{const r=[];for(let j=i;j<N;j++)r.push(j);return r;};

  // ── symbiosis frame (rows 3-5) from step 2 ──
  const fa=A([2,3,4],isNew(2)?.9:0);
  withA(c,fa,()=>{
    c.save();c.setLineDash([10,8]);c.lineDashOffset=-t*6;
    D.round(c,FRAME.x,FRAME.y,FRAME.w,FRAME.h,18,rgba(CYAN,.05),rgba(CYAN,.55+.15*Math.sin(t*1.6)));c.restore();
  });

  // ── placeholders for rows still to come ──
  for(let i=0;i<N;i++){const pa=1-A(range(i),0);if(pa<=.01)continue;
    withA(c,pa*.9,()=>{c.save();c.setLineDash([8,8]);D.round(c,RX,RY[i],RW,RH,14,'rgba(22,51,43,.35)',rgba(WHITE,.16));c.restore();});}

  // ── rows ──
  const pairLit=A([4],isNew(4)?3.4:0);
  for(let i=0;i<N;i++){
    const R=ROWS[i],act=i===k,d0=isNew(i)?0:0,al=A(range(i),d0);if(al<=.002)continue;
    const slide=isNew(i)?(1-ease(tau/.9))*70:0,y=RY[i];
    withA(c,al,()=>{
      c.save();c.translate(slide,0);
      // row card
      const bc=act?rgba(YELLOW,.55+.3*Math.sin(t*2.2)):rgba(WHITE,.28);
            D.round(c,RX,y,RW,RH,14,act?'rgba(32,70,59,.96)':'rgba(28,61,52,.94)',bc);
      if(act){c.save();c.lineWidth=2;c.strokeStyle=rgba(YELLOW,.25+.2*Math.sin(t*2.2));c.beginPath();c.roundRect(RX-4,y-4,RW+8,RH+8,17);c.stroke();c.restore();}
      K.line(c,[[246,y+12],[246,y+RH-12]],rgba(WHITE,.14),2);K.line(c,[[714,y+12],[714,y+RH-12]],rgba(WHITE,.14),2);
      // name + sign pair
      text(c,L(...R.rel),XN,y+33,24,act?YELLOW:WHITE);
      const lit=(i===0||i===4)?pairLit:0;
      const sp=signPair(c,XN,y+64,R.a[3],R.b[3],lit,t);
      if(act&&!lit){const v=mod(t*.7);c.save();c.globalAlpha*=.7*(1-v);D.round(c,sp.x-8-5*v,sp.y-4-5*v,sp.w+16+10*v,sp.h+12+10*v,10,null,YELLOW);c.restore();}
      // picture
      const p=PIC[i],br=act?1+.025*Math.sin(t*1.8):1,bob=act&&i===3?2*Math.sin(t*1.4):0;
      const pw=p.w*br,ph=p.h*br,pr={x:PB.x+(PB.w-pw)/2,y:y+4+(PB.h-ph)/2+bob,w:pw,h:ph};
      withA(c,isNew(i)?clamp((tau-.3)/.6):1,()=>picIn(c,p,pr));
      // organisms
      [[R.a,y+26,1.2],[R.b,y+66,2.0]].forEach(([o,cy,dl],j)=>{
        const pp=pop(i,dl),ta=isNew(i)?clamp((tau-dl)/.5):1;
        disc(c,XD,cy,15,o[3],t+j*.7,pp,act);
        withA(c,ta,()=>{const nm=L(o[0],o[1],o[2]);text(c,nm,XT,cy+8,22,WHITE);
          const w=measure(c,nm,22);text(c,effect(o[3]),XT+w+14,cy+8,22,o[3]===0?rgba(WHITE,.78):SCOL(o[3]));});
      });
      // note
      withA(c,isNew(i)?clamp((tau-3.0)/.6):1,()=>{
        note(c,R.note,XNOTE,y+RH/2,WNOTE,i===3?MUTED:(i===0||i===4)&&lit>0?YELLOW:WHITE);
      });
      c.restore();
    });
  }

  // ── symbiosis tab (right, on the frame line) ──
  withA(c,fa,()=>{const p=tag(c,L('symbiosis','共生：長期住在一起','Symbiosis: living together over time'),RX+RW,TABY,{al:'right',col:CYAN,active:k===2});if(k===2)pulseRing(c,p,t,CYAN);});

  // ── step 4: predation and parasitism share + / −, differ in process ──
  withA(c,pairLit,()=>{
    const y1=RY[0]+RH/2,y5=RY[4]+RH/2,ym=TABY+20;
    c.save();c.lineCap='round';c.setLineDash([8,7]);c.lineDashOffset=-t*14;c.strokeStyle=rgba(YELLOW,.9);c.lineWidth=3;
    c.beginPath();c.moveTo(RX,y1);c.lineTo(GX,y1);c.lineTo(GX,y5);c.lineTo(RX,y5);c.moveTo(GX,ym);c.lineTo(RX,ym);c.stroke();c.restore();
    for(const yy of [y1,y5]){circle(c,RX,yy,6,YELLOW,C.ink,2);K.pulse(c,RX,yy,t,YELLOW,7);}
    const p=tag(c,NEW.same,RX,TABY,{col:YELLOW,active:true});pulseRing(c,p,t+.3,YELLOW);
  });

  // ── fixed footer ──
  tag(c,L('signLegend','＋ 得益　− 受害　0 看不出明顯影響','+ gains · − harmed · 0 no evident effect'),RX,LEGY,{col:WHITE});
  text(c,L('aiNote','AI 插圖，非實拍','AI illustration, not a photo'),RX+RW,LEGY+30,22,MUTED,'right');
}
window.EcologyDraw.relations=draw;
})();
