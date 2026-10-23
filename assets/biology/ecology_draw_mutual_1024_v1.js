/* Ecology lesson 3 · "mutual" canvas (symbiosis tab, view 0), 2026-10-24. Mutualism = both sides gain (+ / +).
 * Only what each side gets; no food-chain arrow, no eaten/eater roles, no energy, no root nodules (lesson 2).
 * Pictures (measured with PIL): EC10_clownfish_anemone 1111x1091, EC21_cleaner_grouper 1400x603 (EC21 is not in K.SIZE yet,
 * so its size is added below if missing). EC21 is cut out with a dark ink outline (no light rim) and is drawn mirrored
 * (cleaner wrasse on the right). EC10 is cut out but keeps pale blue-white background pockets between the tentacles
 * (min RGB > 185, B >= R, G >= R-4, max-min < 45, components >= 150 px whose 3 px ring is < 8 % dark/orange), plus 9 tiny
 * opaque islands. Cleanup (PIL test, ~45k px): pockets -> transparent, then 2 px into light low-saturation pixels next to
 * them, then opaque islands < 400 px; a tight outline of the clownfish (TIGHT) is protected so its white bands stay;
 * a looser polygon (FISH) cuts the clownfish layer that bobs on top.
 * The tentacle edges against the old transparency have no light rim (alpha ramp, same colour as the tentacle) and are kept.
 * EC10 anchors (picture px): fish body (640,470), fish head (800,460), right tentacle (1040,660).
 * EC21 anchors (picture px, before mirroring): cleaner tail (25,370), grouper head (450,250), debris dots on the lips
 *   (232,262) (300,290) (240,378) (330,388) (drawn by program; the picture shows no parasites).
 * Motion: EC10 is drawn in 1-row-aligned strips with a slow sideways wave (large at the tentacle crown, small at the fish
 * band, none at the rock); the clownfish (FISH polygon layer) bobs 2-3 picture px on top.
 * Three steps, 8 s each; s.shown = step. Elements carry the steps they live in; a step change fades only what changes.
 *  0 living together: EC10 large; "Clownfish" / "Sea anemone" pills with leaders; symbiosis card; rising bubbles.
 *  1 what each gets: an "Enemy" shadow swims in from the left, is stopped at the tentacle tips (cyan flash) and turns back;
 *    then an "anemone-eating fish" shadow comes up from below, the clownfish dashes a dashed arc at it and it leaves.
 *    Right cards: Clownfish + green "+" disc "Gets" protection and a home; Sea anemone + green "+" disc "Gets" maybe...
 *  2 + / +: EC10 shrinks to the top-left, EC21 (mirrored) fades in below; each organism: name pill (leader) + small green
 *    "+" disc + what it gets; debris dots on the grouper's lips appear and are cleared one by one; right box
 *    "Mutualism: + / +" with two + discs and "Symbiosis is not always mutualism"; sign legend pill at the bottom.
 * Labels from K.LAB; new labels defined here as P() (see NEW).
 */
(()=>{'use strict';
const K=window.EcologyKit,{P,C,D,clamp,mix,mod,smooth,ease,rgba,text,measure,glow,circle}=K;
const L=(k,zh,en)=>(K.LAB&&K.LAB[k])||P(zh,en);
const EC10='EC10_clownfish_anemone.png',EC21='EC21_cleaner_grouper.png';
if(!K.SIZE[EC21])K.SIZE[EC21]=[1400,603];
// new labels (not in K.LAB)
const NEW={
  gets:P('得到','Gets'),
  fishGain:P('保護和住處','Protection and a home'),
  fishWhy:P('敵人不容易靠近','Enemies find it hard to get close'),
  anemGain:P('可能：吃牠的魚被趕走','Maybe: fish that eat it are chased off'),
  enemy:P('敵人','Enemy'),
  nibbler:P('吃海葵的魚','Anemone-eating fish'),
  cleaner:P('清潔魚','Cleaner wrasse'),
  grouper:P('石斑魚','Grouper'),
  fishGain2:P('得到保護和住處','Gets protection and a home'),
  anemGain2:P('可能得到：吃牠的魚被趕走','May gain: fish that eat it are chased off'),
  cleanerGain:P('得到食物','Gets food'),
  grouperGain:P('寄生蟲和髒物被清掉','Gets parasites and debris removed'),
  notMutual:P('共生不等於互利','Symbiosis is not always mutualism')
};
const N=3,PER=8,CW=960,MOVE=.8;
const WHITE=C.white,YELLOW=C.yellow,CYAN=C.cyan,GREEN=C.green,MUTED=C.muted;

// ── layout ────────────────────────────────────────────────────────────────
const R_BIG=K.fitRect(EC10,20,14,530,520),R_MID=K.fitRect(EC10,110,30,450,470),R_SMALL=K.fitRect(EC10,20,12,250,250);   // 529.6x520 / 450x441.9 / 250x245.5
const R_G=K.fitRect(EC21,20,292,520,230);                                           // 520x223.9 at y 295
const ep=(R,px,py)=>[R.x+px/1111*R.w,R.y+py/1091*R.h];
const gp=(px,py)=>[R_G.x+(1400-px)/1400*R_G.w,R_G.y+py/603*R_G.h];                 // EC21 is mirrored
const FISH_AT=[640,470],HEAD_AT=[790,480],TENT_AT=[1040,660];
const CLEANER_AT=gp(25,370),GROUPER_AT=gp(450,250),DIRT=[[232,262],[300,290],[240,378],[330,388]].map(q=>gp(...q));
const RX=580;                                                                       // right column (steps 0-1)
// clownfish polygon (picture px), ~8-12 px outside the fish
const FISH=[[212,358],[300,362],[385,318],[470,300],[570,286],[600,270],[685,286],[705,338],[785,366],[835,405],[855,460],[835,505],[765,535],[690,562],[668,605],[600,620],[555,585],[470,565],[380,560],[298,520],[212,520]];
// tight outline of the clownfish (PIL: orange/dark pixels closed by 34 px, holes filled, grown 8 px, contour simplified): protected from cleanup
const TIGHT=[[612,618],[589,616],[574,602],[566,581],[566,569],[574,549],[542,516],[517,540],[499,550],[467,560],[449,562],[423,558],[401,546],[386,530],[378,513],[352,486],[332,502],[313,510],[283,512],[255,502],[236,481],[228,458],[226,434],[234,400],[261,372],[280,364],[299,364],[328,374],[356,400],[382,374],[384,353],[394,337],[414,318],[429,310],[456,304],[479,306],[493,310],[512,328],[521,320],[528,324],[535,318],[542,324],[597,276],[608,276],[614,270],[631,272],[635,268],[663,274],[680,290],[690,311],[718,338],[754,356],[777,380],[796,380],[822,400],[852,448],[850,458],[852,466],[842,486],[808,516],[744,542],[700,554],[655,600],[638,600],[622,616],[612,618]];
const FC=[535,445];                                                                 // fish layer pivot

// ── EC10 cleanup: background pockets between tentacles + tiny islands (once) ──
const ST={};
function layers(){
  if(ST.done)return ST.done;const im=K.pic(K.src(EC10));if(!im)return null;
  try{
    const W=im.naturalWidth,H=im.naturalHeight,n=W*H;
    const cv=document.createElement('canvas');cv.width=W;cv.height=H;const g=cv.getContext('2d');g.drawImage(im,0,0);
    const d=g.getImageData(0,0,W,H),a=d.data;
    const pm=document.createElement('canvas');pm.width=W;pm.height=H;const pg=pm.getContext('2d');
    pg.beginPath();TIGHT.forEach((p,i)=>i?pg.lineTo(...p):pg.moveTo(...p));pg.closePath();pg.fillStyle='#fff';pg.fill();
    const fd=pg.getImageData(0,0,W,H).data,fish=new Uint8Array(n);for(let i=0;i<n;i++)fish[i]=fd[i*4+3]>127?1:0;
    const pocket=new Uint8Array(n),fishy=new Uint8Array(n),light=new Uint8Array(n);
    for(let i=0;i<n;i++){const j=i*4,r=a[j],gg=a[j+1],b=a[j+2],al=a[j+3],mx=Math.max(r,gg,b),mn=Math.min(r,gg,b),lum=(r+gg+b)/3;
      if(al>=20&&mn>185&&b>=r&&gg>=r-4&&mx-mn<45&&!fish[i])pocket[i]=1;
      if(lum<70||r-b>90)fishy[i]=1;
      if(al>=20&&lum>170&&mx-mn<55&&!fish[i])light[i]=1;}
    const nb=(i,f)=>{const x=i%W;if(x>0)f(i-1);if(x<W-1)f(i+1);if(i>=W)f(i-W);if(i<n-W)f(i+W);};
    const lab=new Int32Array(n),seen=new Int32Array(n),rm=new Uint8Array(n),q=new Int32Array(n),dist=new Uint8Array(n);let id=0;
    for(let s0=0;s0<n;s0++){if(!pocket[s0]||lab[s0])continue;id++;
      let h=0,e=0;q[e++]=s0;lab[s0]=id;
      while(h<e){const i=q[h++];nb(i,k=>{if(pocket[k]&&!lab[k]){lab[k]=id;q[e++]=k;}});}
      const size=e;if(size<150)continue;
      // 3 px ring around the component: share of dark or orange pixels (fish-like)
      const comp=q.slice(0,size);let rh=0,ring=0,bad=0;const rq=[];
      for(const i of comp){seen[i]=id;dist[i]=0;rq.push(i);}
      while(rh<rq.length){const i=rq[rh++];if(dist[i]>=3)continue;nb(i,k=>{if(seen[k]!==id){seen[k]=id;dist[k]=dist[i]+1;rq.push(k);ring++;if(fishy[k])bad++;}});}
      if(ring&&bad/ring>.08)continue;
      for(const i of comp)rm[i]=1;
    }
    // grow 2 px into light, low-saturation pixels (the soft edge between a pocket and a tentacle)
    let fr=[];for(let i=0;i<n;i++)if(rm[i])fr.push(i);
    for(let it=0;it<2;it++){const nx=[];for(const i of fr)nb(i,k=>{if(!rm[k]&&light[k]){rm[k]=1;nx.push(k);}});fr=nx;}
    // tiny opaque islands
    const isl=new Uint8Array(n);
    for(let s0=0;s0<n;s0++){if(isl[s0]||rm[s0]||a[s0*4+3]<20)continue;let h=0,e=0;q[e++]=s0;isl[s0]=1;
      while(h<e){const i=q[h++];nb(i,k=>{if(!isl[k]&&!rm[k]&&a[k*4+3]>=20){isl[k]=1;q[e++]=k;}});}
      if(e<400)for(let z=0;z<e;z++)rm[q[z]]=1;}
    let cnt=0;for(let i=0;i<n;i++)if(rm[i]){a[i*4+3]=0;cnt++;}
    g.putImageData(d,0,0);
    const fl=document.createElement('canvas');fl.width=W;fl.height=H;const fg=fl.getContext('2d');
    fg.beginPath();FISH.forEach((p,i)=>i?fg.lineTo(...p):fg.moveTo(...p));fg.closePath();fg.clip();fg.drawImage(cv,0,0);
    ST.done={base:cv,fish:fl,removed:cnt};draw.cleanStats=cnt;
  }catch(err){ST.done={base:im,fish:null,removed:-1};}
  return ST.done;
}
// sideways wave amplitude in picture px by picture row: crown large, fish band small, rock none
const AMP=y=>y<230?5:y<300?mix(5,1.5,(y-230)/70):y<600?1.5:y<700?mix(1.5,4,(y-600)/100):y<760?4:y<840?mix(4,0,(y-760)/80):0;
function anemone(c,R,t){
  const Lr=layers();if(!Lr){K.drawIn(c,EC10,R);return;}
  const k=R.w/1111,S=6;
  for(let y0=0;y0<1091;y0+=S){
    const yA=Math.round(R.y+y0*k),yB=Math.round(R.y+Math.min(1091,y0+S)*k);if(yB<=yA)continue;
    const sy=(yA-R.y)/k,sh=(yB-yA)/k,dx=AMP(y0)*Math.sin(t*1.3-y0/150)*k;
    c.drawImage(Lr.base,0,Math.max(0,sy),1111,Math.min(sh,1091-Math.max(0,sy)),R.x+dx,yA,R.w,yB-yA);
  }
  if(Lr.fish){
    const fx=R.x+FC[0]*k,fy=R.y+FC[1]*k,ox=2*Math.sin(t*.9)*k,oy=2.5*Math.sin(t*1.6+.4)*k,rot=.006*Math.sin(t*1.2);
    c.save();c.translate(fx+ox,fy+oy);c.rotate(rot);c.translate(-fx,-fy);c.drawImage(Lr.fish,R.x,R.y,R.w,R.h);c.restore();
  }
}
const fishPt=(R,t,px,py)=>{const k=R.w/1111;const p=ep(R,px,py);return[p[0]+2*Math.sin(t*.9)*k,p[1]+2.5*Math.sin(t*1.6+.4)*k];};

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
function signDisc(c,x,y,r,col,t,pop,ring=1){                         // green "+" disc, glyph drawn as bars
  const rr=r*(.4+.6*ease(pop))*(1+.03*Math.sin(t*2.6)),bw=rr*.95,bt=Math.max(6,rr*.2);
  glow(c,x,y,rr*1.7,col,.25);
  circle(c,x,y,rr,'rgba(11,26,21,.92)',col,Math.max(3,rr*.13));
  const u=mod(t*.55);circle(c,x,y,rr+4+u*16*ring,null,rgba(col,.7*(1-u)),3);
  c.save();c.fillStyle=col;c.beginPath();c.roundRect(x-bw/2,y-bt/2,bw,bt,bt/2);c.roundRect(x-bt/2,y-bw/2,bt,bw,bt/2);c.fill();c.restore();
}
function balanced(c,p,cx,y,maxW,size,col,lh){                         // centred wrap with balanced rows; returns height
  const str=D.tr(p),n=K.splitLines(c,str,maxW,size).length;let lo=40,hi=maxW;
  while(hi-lo>2){const m=(lo+hi)/2;if(K.splitLines(c,str,m,size).length>n)lo=m;else hi=m;}
  K.wrap(c,p,cx,y+size*.95,hi,size,col,lh,'center');return n*lh;
}
function bubbles(c,R,t,n=7){                                           // small bubbles rising from the crown
  for(let i=0;i<n;i++){const ph=(i*0.6180339)%1,q=mod(t/5+ph),x=R.x+R.w*(.18+.64*((i*0.37)%1))+6*Math.sin(t*1.5+i),y=R.y+R.h*(.55-.6*q);
    if(y<R.y-10)continue;const a=q<.15?q/.15:q>.8?(1-q)/.2:1;circle(c,x,y,2.5+2*((i*0.53)%1),null,rgba(WHITE,.55*a),1.8);}
}
// a fish-shaped shadow (body + tail), dir 1 = facing right; no pure black
function shadowFish(c,x,y,len,dir,t,a=1){
  c.save();c.globalAlpha*=a;c.translate(x,y);c.scale(dir,1);
  const hgt=len*.38,wig=Math.sin(t*9)*len*.06;
  c.beginPath();c.moveTo(len*.5,0);c.quadraticCurveTo(len*.15,-hgt*.75,-len*.32,-hgt*.15);
  c.lineTo(-len*.52,-hgt*.55+wig);c.lineTo(-len*.46,wig*.3);c.lineTo(-len*.52,hgt*.55+wig);c.lineTo(-len*.32,hgt*.15);
  c.quadraticCurveTo(len*.15,hgt*.75,len*.5,0);c.closePath();
  c.fillStyle='rgba(8,20,16,.82)';c.fill();c.setLineDash([6,5]);c.strokeStyle=rgba(WHITE,.55);c.lineWidth=2;c.stroke();c.setLineDash([]);
  circle(c,len*.3,-hgt*.08,len*.035,rgba(WHITE,.6));
  c.restore();
}
function flash(c,x,y,t,q){                                             // tentacle sting flash, q 0..1
  const a=Math.sin(Math.PI*clamp(q));if(a<=0)return;
  c.save();c.globalAlpha*=a;glow(c,x,y,34,CYAN,.6);
  for(let i=0;i<7;i++){const an=i/7*K.TAU+t*.6,r0=12,r1=26+6*q;K.sline(c,[[x+r0*Math.cos(an),y+r0*Math.sin(an)],[x+r1*Math.cos(an),y+r1*Math.sin(an)]],CYAN,3);}
  c.restore();
}

// ── frame ─────────────────────────────────────────────────────────────────
function draw(c,s,t){
  const {k}=K.stageClock(s,t,N,PER);
  s.shown=k;
  const st=s.mutualSt||(s.mutualSt={});
  if(st.k===undefined){st.k=k;st.from=-1;st.T=t-9;}
  if(st.k!==k){st.from=st.k;st.k=k;st.T=t;}
  if(t<st.T){st.T=t;st.from=-1;}
  const tau=t-st.T,x=clamp(tau/MOVE),moving=st.from>=0&&x<1,u=moving?smooth(x):1;
  const A=(steps,d)=>{const inK=steps.includes(k),inF=st.from>=0&&steps.includes(st.from);
    const now=!inK?0:inF?1:ease((tau-d)/.7);
    if(!moving)return now;const was=inF?1:0;return now>=was?now:mix(was,now,u);};
  const rectOf=j=>j===2?R_SMALL:j===1?R_MID:R_BIG;
  const R=moving?((a,b)=>({x:mix(a.x,b.x,u),y:mix(a.y,b.y,u),w:mix(a.w,b.w,u),h:mix(a.h,b.h,u)}))(rectOf(st.from),rectOf(k)):rectOf(k);
  const ct=mod(tau,PER);                                               // loop time inside a step (held steps repeat)

  // ── EC10 (all steps) ──
  anemone(c,R,t);
  withA(c,A([0,1],0),()=>bubbles(c,R,t));

  // ── step 0: names + symbiosis ──
  withA(c,A([0],.4),()=>{
    const a=tag(c,L('clownfish','小丑魚','Clownfish'),RX+20,96,{col:WHITE,minX:RX});
    leader(c,[a.x,a.y+a.h/2],fishPt(R,t,...HEAD_AT),WHITE,t);
    const b=tag(c,L('anemone','海葵','Sea anemone'),RX+20,300,{col:WHITE,minX:RX});
    leader(c,[b.x,b.y+b.h/2],ep(R,...TENT_AT),WHITE,t+.5);
  });
  withA(c,A([0],1.4),()=>{
    const B={x:RX,y:400,w:CW-12-RX,h:st.symH||110};
    D.round(c,B.x,B.y,B.w,B.h,16,'rgba(28,61,52,.95)',rgba(YELLOW,.45+.25*Math.sin(t*2)));
    const h=balanced(c,L('symbiosis','共生：長期住在一起','Symbiosis: living together over time'),B.x+B.w/2,B.y+18,B.w-36,24,YELLOW,34);
    st.symH=h+36;
  });

  // ── step 1: enemy is stopped, anemone-eating fish is chased off; what each gets ──
  withA(c,A([1],.2),()=>{
    // enemy from the left: approach 0-1.3 s, stopped 1.3-1.7, back off 1.7-3.0
    const tip=ep(R,30,385);
    if(ct<3.1){const q=ct<1.3?smooth(ct/1.3):ct<1.7?1:1-smooth((ct-1.7)/1.3),dir=ct<1.5?1:-1;
      const sx=mix(-90,tip[0]-62,q),sy=tip[1]-6+8*Math.sin(ct*3);
      const a=ct<.2?ct/.2:ct>2.8?(3.1-ct)/.3:1;
      shadowFish(c,sx,sy,130,dir,t,a);
      if(ct>1.15&&ct<2.0)flash(c,tip[0]+14,tip[1],t,(ct-1.15)/.85);
      withA(c,a*clamp((sx+20)/60),()=>tag(c,NEW.enemy,sx-30,sy-70,{col:WHITE,minX:8,maxX:RX-20}));}
    // anemone-eating fish from below: approach 3.2-4.4, chased 4.4-5.0, leave 5.0-6.4
    const near=ep(R,1000,820);
    if(ct>3.2&&ct<6.5){const v=ct-3.2,q=v<1.2?smooth(v/1.2):v<1.8?1:1-smooth((v-1.8)/1.4);
      const nx=mix(near[0]+30,near[0],q),ny=mix(650,near[1]+50,q);
      const a=v<.2?v/.2:v>3.0?(3.3-v)/.3:1,dir=v<1.6?-1:1;
      c.save();c.translate(nx,ny);c.rotate(dir<0?-Math.PI/2-.3:Math.PI/2-.3);c.translate(-nx,-ny);shadowFish(c,nx,ny,90,1,t,a);c.restore();
      if(v>1.0&&v<2.2){const w=clamp((v-1.0)/.4)*(1-clamp((v-1.9)/.3)),f=fishPt(R,t,...HEAD_AT);
        withA(c,w,()=>{c.save();c.setLineDash([8,7]);c.lineDashOffset=-t*20;c.beginPath();c.moveTo(...f);
          c.quadraticCurveTo(f[0]+60,(f[1]+ny)/2,nx-6,ny-24);c.strokeStyle=rgba(WHITE,.9);c.lineWidth=3;c.stroke();c.restore();K.pulse(c,f[0],f[1],t*1.4,WHITE,14);});}
      withA(c,a,()=>tag(c,NEW.nibbler,nx-20,Math.min(ny+38,548),{al:'center',col:WHITE,minX:8,maxX:RX-12}));}
  });
  const card=(y,h,name,pop,lines,ph)=>{
    D.round(c,RX,y,CW-12-RX,h,16,'rgba(28,61,52,.95)',rgba(GREEN,.45+.2*Math.sin(t*2+ph)));
    tag(c,name,RX+16,y+14,{col:WHITE,minX:RX+16});
    signDisc(c,RX+56,y+112,32,GREEN,t+ph,pop);
    text(c,NEW.gets,RX+106,y+96,26,GREEN);
    let yy=y+132;for(const [p,col] of lines)yy+=K.wrap(c,p,RX+106,yy,CW-12-RX-106-14,22,col,30);
  };
  const popA=k===1&&!moving?clamp((tau-1.6)/.6):1,popB=k===1&&!moving?clamp((tau-4.6)/.6):1;
  withA(c,A([1],1.6),()=>card(14,236,L('clownfish','小丑魚','Clownfish'),popA,[[NEW.fishGain,WHITE],[NEW.fishWhy,MUTED]],0));
  withA(c,A([1],4.6),()=>card(264,236,L('anemone','海葵','Sea anemone'),popB,[[NEW.anemGain,WHITE]],1.3));

  // ── step 2: two examples, + / + ──
  withA(c,A([2],.5),()=>{
    K.drawIn(c,EC21,R_G,{flip:true});
    // debris dots on the grouper's lips, cleared one by one (loop 4 s)
    const q=mod(t,4);
    DIRT.forEach((p,i)=>{const t0=.8+i*.55,a=q<.3?q/.3:q<t0?1:1-clamp((q-t0)/.35);
      if(a>0){circle(c,p[0],p[1],3.2,rgba('#6b5a3c',a),rgba('#3d3324',a),1.2);circle(c,p[0]+5,p[1]+3,2,rgba('#6b5a3c',a));}
      if(q>t0-.1&&q<t0+.4){const v=(q-t0+.1)/.5;circle(c,p[0],p[1],6+10*v,null,rgba(CYAN,.9*(1-v)),2);}});
  });
  const pop2=k===2&&!moving?clamp((tau-1.6)/.6):1;
  const row=(px,py,name,gain,anchor,ph,maxX)=>{
    const p=tag(c,name,px,py,{col:WHITE,minX:px});
    leader(c,[p.x,p.y+p.h/2],anchor,WHITE,t+ph);
    signDisc(c,px+16,py+66,16,GREEN,t+ph,pop2,.6);
    K.wrap(c,gain,px+42,py+74,maxX-px-42,22,GREEN,30);
  };
  withA(c,A([2],1.0),()=>{
    row(290,18,L('clownfish','小丑魚','Clownfish'),NEW.fishGain2,fishPt(R,t,...FISH_AT),0,650);
    row(290,130,L('anemone','海葵','Sea anemone'),NEW.anemGain2,ep(R,...TENT_AT),.4,650);
  });
  withA(c,A([2],1.4),()=>{
    row(560,296,NEW.grouper,NEW.grouperGain,GROUPER_AT,.8,CW-12);
    row(560,418,NEW.cleaner,NEW.cleanerGain,CLEANER_AT,1.2,CW-12);
  });
  withA(c,A([2],2.4),()=>{
    const B={x:664,y:14,w:CW-12-664,h:248},cx=B.x+B.w/2;
    D.round(c,B.x,B.y,B.w,B.h,16,'rgba(28,61,52,.95)',rgba(YELLOW,.45+.25*Math.sin(t*2)));
    const mu=L('mutualism','互利共生','Mutualism'),lab=P(mu[0]+'：＋／＋',mu[1]+': + / +');
    const p=tag(c,lab,cx,B.y+16,{al:'center',col:YELLOW,active:true,size:24,minX:B.x+8,maxX:B.x+B.w-8});
    if(k===2)pulseRing(c,p,t,YELLOW);
    const pp=k===2&&!moving?clamp((tau-2.8)/.6):1;
    signDisc(c,cx-62,B.y+118,28,GREEN,t,pp);signDisc(c,cx+62,B.y+118,28,GREEN,t+.6,pp);
    K.sline(c,[[cx+10,B.y+96],[cx-10,B.y+140]],WHITE,4);
    balanced(c,NEW.notMutual,cx,B.y+170,B.w-32,22,MUTED,30);
  });
  withA(c,A([2],3.0),()=>{tag(c,L('signLegend','＋ 得益　− 受害　0 看不出明顯影響','+ gains · − harmed · 0 no evident effect'),20,528,{col:WHITE});});

  text(c,L('aiNote','AI 插圖，非實拍','AI illustration, not a photo'),CW-12,590,22,MUTED,'right');
}
window.EcologyDraw.mutual=draw;
})();
