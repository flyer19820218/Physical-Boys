/* Ecology lesson 3 · "commens" canvas (symbiosis tab, view 1), 2026-10-24. Commensalism = one side gains, the other shows
 * no evident effect in this situation (+ / 0). Only what each side gets; no food-chain arrow, no eaten/eater roles (lesson 2);
 * the shark never eats the remora. "Growing on a host is not parasitism" is one small tag only (parasitism is the next view).
 * Pictures (K.SIZE, measured with PIL): EC11_nest_fern 1071x1376, EC24_remora_shark 1400x523. Both are cut out with a 1-2 px
 * pale rim (fern edge pixels: 79 % lum > 170). Cleanup (PIL test): light low-saturation pixels (lum > 150, max-min < 70) within
 * 2 px of transparency -> transparent (fern ~9.0k px, shark ~2.5k px; EC24 fin tips, belly and tail checked). The fern trunk is cut flat at the top and ends in a pale
 * jagged edge at the bottom, so its top 90 px and bottom 150 px fade out (alpha ramp) instead of ending in a hard line.
 * Fern anchors (picture px): leaf tip right (1000,470), leaves in the light (420,330) (640,380) (250,380) (880,520) (150,640),
 *   roots on the bark (560,900), lower trunk (640,1150), trunk under the roots for the magnifier (600,1180).
 * EC24 anchors (picture px): oval sucker disc centre (464,225), half-axes 58 x 20; remora mouth (407,230); remora body (580,245);
 *   shark mouth / jaw (160,322); shark tail stock (1180,270); shark flank for the magnifier (950,300). The remora clings behind
 *   the gill slits, head to the left like the shark, about a quarter of the shark's length.
 * Three steps, 8 s each; s.shown = step. Elements carry the steps they live in; a step change fades only what changes.
 *  0 on a tree: fern large (left); yellow light rays run from a "Light" pill down to the leaves; right column: fern card
 *    (leader, green + disc, "Gets" a high, lit spot), tree card (leader, grey 0 disc, "0 No evident effect", "In this example"),
 *    "Roots grip the bark" pill with a leader and pulse at the roots, small tag "Growing on a host is not parasitism".
 *  1 on a shark: shark picture bobs while water streaks slide past; "Sucker" pill on the remora head; scrap flecks drift from
 *    the shark's mouth to the remora's mouth ("Possible food scraps"); remora card (+, a ride, may eat scraps), shark card (0).
 *  2 + / 0: both pictures small side by side; "Commensalism: + / 0" header; 2x2 table: fern + / tree 0, remora + / shark 0
 *    (same signs); a magnifier sweeps over the trunk and the shark flank and the matching 0 disc lights up; muted note
 *    "0 only means no evident effect in this situation"; sign legend pill.
 * Labels from K.LAB; new labels defined here as P() (see NEW).
 */
(()=>{'use strict';
const K=window.EcologyKit,{P,C,D,clamp,mix,mod,smooth,ease,rgba,text,measure,glow,circle}=K;
const L=(k,zh,en)=>(K.LAB&&K.LAB[k])||P(zh,en);
const FERN='EC11_nest_fern.png',SHARK='EC24_remora_shark.png';
if(!K.SIZE[SHARK])K.SIZE[SHARK]=[1400,523];
// new labels (not in K.LAB)
const NEW={
  gets:P('得到','Gets'),
  fernGain:P('高處、受光的位置','A high, well-lit spot'),
  roots:P('根抓著樹皮，不在土裡','Roots grip the bark, not soil'),
  inThis:P('在這個例子裡','In this example'),
  inSitu:P('在這個情境裡','In this situation'),
  epiphyte:P('附生不等於寄生','Growing on a host is not parasitism'),
  sucker:P('吸盤','Sucker disc'),
  scraps:P('可能的食物殘渣','Possible scraps'),
  ride:P('跟著移動（搭便車）','Travels along (a free ride)'),
  mayEat:P('可能吃到食物殘渣','May eat leftover scraps'),
  fernGainS:P('得到：受光的高處','Gets: a high, lit spot'),
  remGainS:P('得到：搭便車，可能吃到殘渣','Gets: a ride, maybe scraps'),
  observe:P('觀察','Observe'),
  zeroNote:[P('0 只代表在這個情境','0 only means no evident'),P('看不出明顯影響','effect in this situation')]
};
const N=3,PER=8,CW=960,MOVE=.8;
const WHITE=C.white,YELLOW=C.yellow,CYAN=C.cyan,GREEN=C.green,MUTED=C.muted;
const ZERO_TXT=()=>{const ne=L('noEffect','看不出明顯影響','No evident effect');return P('0 '+ne[0],'0 '+ne[1]);};

// ── layout ────────────────────────────────────────────────────────────────
const R_F0=K.fitRect(FERN,14,12,440,576),R_F2=K.fitRect(FERN,14,12,290,380);       // 440x565.3 at y 17.3 / 290x372.6 at y 15.7
const R_S1=K.fitRect(SHARK,14,10,932,350),R_S2=K.fitRect(SHARK,330,30,610,245);     // 932x348.2 at y 10.9 / 610x227.9 at y 38.6
const fp=(R,px,py)=>[R.x+px/1071*R.w,R.y+py/1376*R.h];
const sp=(R,px,py)=>[R.x+px/1400*R.w,R.y+py/523*R.h];
const F_TIP=[880,520],F_LIGHT=[[420,330],[640,380],[250,380],[760,520],[150,640]],F_ROOT=[560,900],F_TRUNK=[640,1150],F_LOOK=[600,1180];
const S_REM=[580,245],S_SUCK=[464,225],SUCK_R=[58,20],S_RMOUTH=[407,230],S_MOUTH=[160,322],S_TAIL=[1180,270],S_LOOK=[950,300];
const RX0=486;                                                                      // right column (step 0)

// ── picture rim cleanup (once per picture, 2 px deep; fern trunk ends fade out) ──
const CLEAN={};
function cleaned(file){
  if(CLEAN[file])return CLEAN[file];const im=K.pic(K.src(file));if(!im)return null;
  try{const W=im.naturalWidth,H=im.naturalHeight,cv=document.createElement('canvas');cv.width=W;cv.height=H;const g=cv.getContext('2d');g.drawImage(im,0,0);
    const d=g.getImageData(0,0,W,H),a=d.data,n=W*H,dep=new Uint8Array(n).fill(255),q=new Int32Array(n);let h=0,e=0,cnt=0;
    const light=i=>{const j=i*4,r=a[j],gg=a[j+1],b=a[j+2];return a[j+3]>=20&&(r+gg+b)/3>150&&Math.max(r,gg,b)-Math.min(r,gg,b)<70;};
    for(let i=0;i<n;i++)if(a[i*4+3]<20){dep[i]=0;q[e++]=i;}
    while(h<e){const i=q[h++];if(dep[i]>=2)continue;const x=i%W;
      for(const k of [x>0?i-1:-1,x<W-1?i+1:-1,i-W,i+W])if(k>=0&&k<n&&dep[k]===255&&light(k)){dep[k]=dep[i]+1;q[e++]=k;}}
    for(let i=0;i<n;i++)if(dep[i]>0&&dep[i]<255){a[i*4+3]=0;cnt++;}
    g.putImageData(d,0,0);
    if(file===FERN){g.save();g.globalCompositeOperation='destination-out';
      let gr=g.createLinearGradient(0,0,0,90);gr.addColorStop(0,'rgba(0,0,0,1)');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(0,0,W,90);
      gr=g.createLinearGradient(0,H-150,0,H);gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(.75,'rgba(0,0,0,.9)');gr.addColorStop(1,'rgba(0,0,0,1)');g.fillStyle=gr;g.fillRect(0,H-150,W,150);g.restore();}
    CLEAN[file]=cv;draw.cleanStats=Object.assign(draw.cleanStats||{},{[file]:cnt});}catch(err){CLEAN[file]=im;}
  return CLEAN[file];
}
function picIn(c,file,r){const cv=cleaned(file);if(!cv){K.drawIn(c,file,r);return;}c.drawImage(cv,r.x,r.y,r.w,r.h);}

// ── helpers ───────────────────────────────────────────────────────────────
const withA=(c,a,fn)=>{if(a<=0.002)return;c.save();c.globalAlpha*=Math.min(1,a);fn();c.restore();};
function tag(c,p,x,y,{al='left',col=WHITE,active=false,size=22,fill='rgba(11,26,21,.92)',minX=8,maxX=CW-8}={}){
  const w=measure(c,p,size)+28,h=size+18,bx=Math.max(minX,Math.min(maxX-w,al==='right'?x-w:al==='center'?x-w/2:x));
  D.round(c,bx,y,w,h,h/2,active?col:fill,active?WHITE:rgba(col,.9));
  text(c,p,bx+w/2,y+h/2+size*.36,size,active?C.deep:col,'center');
  return{x:bx,y,w,h};
}
function pulseRing(c,p,t,col=YELLOW){const u=mod(t*.7);D.round(c,p.x-6*u,p.y-6*u,p.w+12*u,p.h+12*u,p.h/2+6*u,null,rgba(col,.8*(1-u)));}
function dline(c,p0,p1,col,t,w=3,dash=[8,7]){
  c.save();c.lineCap='round';c.setLineDash(dash);c.lineDashOffset=-t*14;c.beginPath();c.moveTo(...p0);c.lineTo(...p1);c.strokeStyle=rgba(col,.85);c.lineWidth=w;c.stroke();c.restore();
}
function leader(c,p0,p1,col,t){dline(c,p0,p1,col,t);circle(c,p1[0],p1[1],6,col,C.ink,2);K.pulse(c,p1[0],p1[1],t,col,7);}
function plusDisc(c,x,y,r,t,pop,ring=1){                              // green "+" disc, glyph drawn as bars
  const rr=r*(.4+.6*ease(pop))*(1+.03*Math.sin(t*2.6)),bw=rr*.95,bt=Math.max(6,rr*.2);
  glow(c,x,y,rr*1.7,GREEN,.25);
  circle(c,x,y,rr,'rgba(11,26,21,.92)',GREEN,Math.max(3,rr*.13));
  const u=mod(t*.55);circle(c,x,y,rr+4+u*16*ring,null,rgba(GREEN,.7*(1-u)),3);
  c.save();c.fillStyle=GREEN;c.beginPath();c.roundRect(x-bw/2,y-bt/2,bw,bt,bt/2);c.roundRect(x-bt/2,y-bw/2,bt,bw,bt/2);c.fill();c.restore();
}
function zeroDisc(c,x,y,r,t,pop,lit=0){                               // grey-white, faded "0" disc: no ripple, only a slow breath
  const rr=r*(.4+.6*ease(pop)),br=.5+.08*Math.sin(t*1.7)+.35*lit,bt=Math.max(5,rr*.17);
  if(lit>0)glow(c,x,y,rr*1.8,WHITE,.22*lit);
  circle(c,x,y,rr,'rgba(11,26,21,.88)',rgba(WHITE,.4*br+.12),Math.max(3,rr*.12));
  c.save();c.setLineDash([5,5]);c.lineDashOffset=-t*4;circle(c,x,y,rr+5,null,rgba(WHITE,.18+.12*Math.sin(t*1.7)),2);c.restore();
  K.ellipse(c,x,y,rr*.3,rr*.48,null,rgba(WHITE,.55*br+.2),bt);
}
function lwrap(c,p,x,y,maxW,size,col,lh){                            // left wrap with balanced rows; returns height
  const str=D.tr(p),n=K.splitLines(c,str,maxW,size).length;let lo=40,hi=maxW;
  while(hi-lo>2){const m=(lo+hi)/2;if(K.splitLines(c,str,m,size).length>n)lo=m;else hi=m;}
  return K.wrap(c,p,x,y,hi+1,size,col,lh);
}
const lerpR=(a,b,u)=>({x:mix(a.x,b.x,u),y:mix(a.y,b.y,u),w:mix(a.w,b.w,u),h:mix(a.h,b.h,u)});
// light rays from a source point to leaves: dashed beam + travelling glints + glow on the leaf
function rays(c,src,pts,t){
  pts.forEach((p,i)=>{
    c.save();c.lineCap='round';c.setLineDash([10,9]);c.lineDashOffset=-t*22-i*7;c.beginPath();c.moveTo(...src);c.lineTo(...p);
    c.strokeStyle=rgba(YELLOW,.5);c.lineWidth=3;c.stroke();c.restore();
    const u=mod(t*.45+i*.21),g=K.lerpP(src,p,u);glow(c,g[0],g[1],12,YELLOW,.7*Math.sin(Math.PI*u));
    const a=.35+.25*Math.sin(t*2.2+i*1.3);glow(c,p[0],p[1],22,YELLOW,a);circle(c,p[0],p[1],4,rgba(YELLOW,.9));
  });
}
// water streaks sliding past (the shark swims left, so the water moves right relative to it)
function streaks(c,R,t){
  for(let i=0;i<9;i++){const ph=(i*0.6180339)%1,u=mod(t*.28+ph),y=R.y+R.h*(.08+.84*((i*0.437)%1)),x=R.x-40+u*(R.w+80),len=40+30*((i*0.71)%1);
    const a=Math.sin(Math.PI*u)*.45;K.sline(c,[[x,y],[x+len,y]],rgba(WHITE,a),2.5);}
}
// magnifier (lens + handle), drawn by program
function lens(c,x,y,r,a,side){withA(c,a,()=>{glow(c,x,y,r*1.2,WHITE,.18);circle(c,x,y,r,'rgba(242,236,217,.10)',rgba(WHITE,.9),4);
  K.sline(c,[[x+r*.72,y+r*.72],[x+r*1.5,y+r*1.5]],rgba(WHITE,.9),8);
  if(side)tag(c,NEW.observe,x+r+10,y-20,{col:WHITE,maxX:328});else tag(c,NEW.observe,x,y-r-48,{al:'center',col:WHITE});});}

// ── frame ─────────────────────────────────────────────────────────────────
function draw(c,s,t){
  const {k}=K.stageClock(s,t,N,PER);
  s.shown=k;
  const st=s.commensSt||(s.commensSt={});
  if(st.k===undefined){st.k=k;st.from=-1;st.T=t-9;}
  if(st.k!==k){st.from=st.k;st.k=k;st.T=t;}
  if(t<st.T){st.T=t;st.from=-1;}
  const tau=t-st.T,x=clamp(tau/MOVE),moving=st.from>=0&&x<1,u=moving?smooth(x):1;
  const A=(steps,d)=>{const inK=steps.includes(k),inF=st.from>=0&&steps.includes(st.from);
    const now=!inK?0:inF?1:ease((tau-d)/.7);
    if(!moving)return now;const was=inF?1:0;return now>=was?now:mix(was,now,u);};
  const RR=m=>(moving&&m[st.from]&&m[k])?lerpR(m[st.from],m[k],u):m[k]||m[st.from];
  const FM={0:R_F0,2:R_F2},SM={1:R_S1,2:R_S2};
  const RF=RR(FM),RS0=RR(SM);
  const bob=2.6*Math.sin(t*1.4),RS=RS0?{x:RS0.x,y:RS0.y+bob,w:RS0.w,h:RS0.h}:null;
  const pop=(d)=>moving?1:clamp((tau-d)/.6);

  // ── pictures ──
  withA(c,A([1,2],.4),()=>streaks(c,RS,t));
  withA(c,A([0,2],.6),()=>picIn(c,FERN,RF));
  withA(c,A([1,2],.4),()=>{c.save();const cx=RS.x+RS.w/2,cy=RS.y+RS.h/2;c.translate(cx,cy);c.rotate(.004*Math.sin(t*1.1));c.translate(-cx,-cy);picIn(c,SHARK,RS);c.restore();});

  // ── step 0: fern on a tree ──
  const lightSrc=[384,62];
  withA(c,A([0],1.4),()=>{rays(c,lightSrc,F_LIGHT.map(q=>fp(RF,...q)),t);const p=tag(c,L('light','光','Light'),lightSrc[0],20,{al:'center',col:YELLOW,maxX:RX0-8});if(k===0)pulseRing(c,p,t,YELLOW);});
  const card=(X,y,h,name,anchor,ph,body,W=CW-12-X,top=false)=>{
    D.round(c,X,y,W,h,16,'rgba(28,61,52,.95)',rgba(body.zero?WHITE:GREEN,body.zero?.28:.45+.2*Math.sin(t*2+ph)));
    const p=tag(c,name,X+16,y+14,{col:WHITE,minX:X+16});
    leader(c,top?[p.x+p.w/2,p.y]:[p.x,p.y+p.h/2],anchor,WHITE,t+ph);
    if(body.zero){zeroDisc(c,X+56,y+104,30,t+ph,body.pop);let yy=y+88;yy+=K.wrap(c,ZERO_TXT(),X+102,yy+10,W-102-14,24,WHITE,32);
      K.wrap(c,body.note,X+102,yy+10,W-102-14,22,MUTED,30);}
    else{plusDisc(c,X+56,y+108,32,t+ph,body.pop);text(c,NEW.gets,X+102,y+96,26,GREEN);
      let yy=y+132;for(const [q,col] of body.lines)yy+=K.wrap(c,q,X+102,yy,W-102-14,22,col,30);}
  };
  withA(c,A([0],.6),()=>card(RX0,14,180,L('nestFern','鳥巢蕨',"Bird's-nest fern"),fp(RF,...F_TIP),0,{pop:k===0?pop(1.2):1,lines:[[NEW.fernGain,WHITE]]}));
  withA(c,A([0],2.6),()=>{const p=tag(c,NEW.roots,RX0,210,{col:WHITE,minX:RX0});const r=fp(RF,...F_ROOT);leader(c,[p.x,p.y+p.h/2],r,WHITE,t+.3);
    const v=mod(t*.6);circle(c,r[0],r[1],16+26*v,null,rgba(WHITE,.6*(1-v)),2.5);});
  withA(c,A([0],3.8),()=>card(RX0,268,150,L('tree','樹','Tree'),fp(RF,...F_TRUNK),.9,{zero:true,pop:k===0?pop(4.2):1,note:NEW.inThis}));
  withA(c,A([0],5.2),()=>{const p=tag(c,NEW.epiphyte,RX0,436,{col:YELLOW,minX:RX0});if(k===0)pulseRing(c,p,t+.4,YELLOW);});

  // ── step 1: remora on a shark ──
  withA(c,A([1],1.6),()=>{const p=tag(c,NEW.sucker,300,40,{al:'center',col:WHITE});const h=sp(RS,...S_SUCK),kk=RS.w/1400;leader(c,[p.x+p.w/2,p.y+p.h],[h[0],h[1]-SUCK_R[1]*kk-4],WHITE,t+.2);
    const v=mod(t*.5);K.ellipse(c,h[0],h[1],SUCK_R[0]*kk+3+12*v,SUCK_R[1]*kk+2+6*v,null,rgba(CYAN,.85*(1-v)),2.5);});
  withA(c,A([1],2.6),()=>{
    const m=sp(RS,...S_MOUTH),r=sp(RS,...S_RMOUTH),cp=[m[0]-46,(m[1]+r[1])/2-4];
    for(let i=0;i<6;i++){const q=mod(t/3.2+i/6),p=K.bez(m,cp,r,q),a=q<.15?q/.15:q>.85?(1-q)/.15:1;
      c.save();c.translate(p[0],p[1]);c.rotate(t*1.5+i);c.fillStyle=rgba(C.sand,.95*a);c.strokeStyle=rgba('#6b5a3c',a);c.lineWidth=1.2;
      c.beginPath();c.moveTo(-6,-3);c.lineTo(4,-5);c.lineTo(6,3);c.lineTo(-3,5);c.closePath();c.fill();c.stroke();c.restore();
      if(q>.88){const v=(q-.88)/.12;circle(c,r[0],r[1],5+9*v,null,rgba(CYAN,.8*(1-v)),2);}}
    const p=tag(c,NEW.scraps,14,40,{col:WHITE});const mid=K.bez(m,cp,r,.3);leader(c,[p.x+60,p.y+p.h],mid,WHITE,t+.6);
  });
  withA(c,A([1],.8),()=>card(14,372,170,L('remora','鮣魚','Remora'),sp(RS,...S_REM),0,{pop:k===1?pop(1.4):1,lines:[[NEW.ride,WHITE],[NEW.mayEat,WHITE]]},456,true));
  withA(c,A([1],4.4),()=>card(490,372,170,L('shark','鯊魚','Shark'),sp(RS,...S_TAIL),.9,{zero:true,pop:k===1?pop(4.8):1,note:NEW.inSitu},458,true));

  // ── step 2: two examples, + / 0 ──
  const look=mod(t,6)/6,onTree=look<.5,lw=clamp(3*Math.sin(Math.PI*mod(look*2)));         // magnifier alternates: tree 0-3 s, shark 3-6 s
  withA(c,A([2],3.0),()=>{
    if(onTree){const p=fp(RF,...F_LOOK);lens(c,p[0]+18*Math.sin(t*1.2),p[1]-60*mod(look*2),30,lw,true);}
    else{const p=sp(RS,...S_LOOK);lens(c,p[0]-120*mod(look*2-1)+60,p[1]-8+6*Math.sin(t*1.5),30,lw);}
  });
  withA(c,A([2],.6),()=>{
    const cm=L('commensalism','片利共生','Commensalism'),lab=P(cm[0]+'：＋／0',cm[1]+': + / 0');
    const p=tag(c,lab,639,288,{al:'center',col:YELLOW,active:true,size:24,minX:330,maxX:948});if(k===2)pulseRing(c,p,t,YELLOW);
  });
  const cell=(X,y,name,isZero,gain,ph,d,lit)=>{
    const W=304,pp=k===2?pop(d+.3):1;
    D.round(c,X,y,W,100,14,'rgba(28,61,52,.92)',isZero?rgba(WHITE,.22+.4*lit):rgba(GREEN,.4+.15*Math.sin(t*2+ph)));
    if(isZero)zeroDisc(c,X+30,y+50,20,t+ph,pp,lit);else plusDisc(c,X+30,y+50,20,t+ph,pp,.6);
    text(c,name,X+62,y+31,22,WHITE);
    lwrap(c,isZero?ZERO_TXT():gain,X+62,y+60,W-62-12,22,isZero?WHITE:GREEN,28);
  };
  const litT=k===2?lw*(onTree?1:0):0,litS=k===2?lw*(onTree?0:1):0;
  withA(c,A([2],1.2),()=>{cell(330,340,L('nestFern','鳥巢蕨',"Bird's-nest fern"),false,NEW.fernGainS,0,1.2,0);cell(644,340,L('tree','樹','Tree'),true,null,.5,1.2,litT);});
  withA(c,A([2],2.0),()=>{cell(330,446,L('remora','鮣魚','Remora'),false,NEW.remGainS,1,2.0,0);cell(644,446,L('shark','鯊魚','Shark'),true,null,1.5,2.0,litS);});
  withA(c,A([2],3.0),()=>NEW.zeroNote.forEach((q,i)=>text(c,q,159,428+i*32,22,MUTED,'center')));
  withA(c,A([2],3.6),()=>tag(c,L('signLegend','＋ 得益　− 受害　0 看不出明顯影響','+ gains · − harmed · 0 no evident effect'),330,552,{col:WHITE,minX:330}));

  const ai=L('aiNote','AI 插圖，非實拍','AI illustration, not a photo');
  withA(c,A([0,1],0),()=>text(c,ai,CW-12,590,22,MUTED,'right'));
  withA(c,A([2],0),()=>text(c,ai,14,590,22,MUTED,'left'));
}
window.EcologyDraw.commens=draw;
})();
