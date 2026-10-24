/* Unit 11 lesson 1 · "response" canvas (genetic-variation tab, view 1), 2026-10-24. When conditions change, who is affected? (plan section 2, response).
 * Four steps, 9 s each; s.shown = step. s.phase<0 plays all, s.phase>=0 holds a step (beetles breathe, lit dots pulse, sun rays turn,
 * hyphae sway, rings pulse).
 * Left 2/3 = stage (x 16..636), right 1/3 = step card (x 652..944): pink "Genetic diversity" header, the four step labels, the step's
 * title (VIEWS.response.names) and the change of the step (sun / hyphae with its name). Fine / affected dots are named on the stage.
 * Two groups of 12 ladybird icons (3 rows x 4), each icon with a dot on a survival strip below it (green = fine, dark = affected):
 *   left "less varied, all one base colour" (12 x orange0), right "more varied, three base colours" (rows: patch red, black2red black,
 *   pale yellow). The left kind is not one of the right kinds, so "left all dark" never contradicts a lit row on the right.
 *  0 a normal year: icons pop in, all dots light up.
 *  1 change A (heat and drought; sun + thermometer drawn top right): all left dots go dark one by one; on the right only the black row.
 *  2 change B (a new disease; hyphae symbol drawn top right): every dot first relights (another year), then the left group and the
 *    pale-yellow row go dark; the black row keeps a hollow "A" badge. Pill "No kind is best in every condition".
 *  3 crops (scene swaps out-then-in): two small grid fields, one variety (all variety 1) vs three varieties mixed (1 green, 2 yellow-green,
 *    3 dark green); the same heat and drought: the whole single-variety field wilts, only the variety-1 row on the mixed side.
 * Colours (plan 1.4): genetic diversity pink (card header, "more varied" tag); change / pressure orange (pills, sun, hyphae);
 * dots: fine green #4ade80, affected dark grey-green #3b4a44 (never black). Always shown with names (legend row + card legend).
 * No numbers, no evolution, no adaptation; the note "schematic, not a survival forecast" stays on all steps.
 * Pictures (K.SIZE, all cut out): environment_ai_1024/BD1_ladybird_orange0 / patch / black2red / pale (~415 x 488..525, alpha bbox = full).
 * New labels (P(), not in K.LAB) are listed in T and KINDS below.
 */
(()=>{'use strict';
const K=window.EnvironmentKit,{P,C,D,clamp,mix,mod,smooth,ease,rgba,text,measure,circle}=K;
const L=(k,zh,en)=>(K.LAB&&K.LAB[k])||P(zh,en);
const N=4,PER=9,CW=960,MOVE=.8;
const WHITE=C.white,MUTED=C.muted,PINK=K.COL.genetic,ORANGE=K.COL.pressure,FINE='#4ade80',HIT='#3b4a44',HIT_EDGE='#6f8279';
const E=K.ENV||'environment_ai_1024/';

// ── labels ────────────────────────────────────────────────────────────────
const T={
 short:[P('平常的年','A normal year'),P('高溫乾旱','Heat and drought'),P('換一種變動','A different change'),P('作物也一樣','Crops too')],
 names:[P('平常的年：兩群都沒事','A normal year: both groups fine'),P('變動 A：受影響的是其中一種','Change A: one kind is affected'),
        P('變動 B：這次換了另一種','Change B: a different kind this time'),P('作物：整片同品種 vs 混種','Crops: one variety vs mixed varieties')],
 keep:P('保留不同的反應','Keeping different responses'),
 less:P('較單一','Less varied'),lessSub:P('底色都一樣','All one base colour'),
 more:P('較多樣','More varied'),moreSub:P('三種底色','Three base colours'),
 normal:P('平常的年','A normal year'),changeA:P('變動 A','Change A'),changeB:P('變動 B','Change B'),changeC:P('遇到變動','A change comes'),
 heat:P('高溫乾旱','Heat and drought'),disease:P('新的病','A new disease'),
 fine:P('沒事','Fine'),hit:P('受影響','Affected'),
 noBest:P('沒有哪一種在所有環境都占優勢','No kind is best in every condition'),
 oneVar:P('單一品種','One variety'),oneVarSub:P('整片同一個品種','All one variety'),
 mixVar:P('混種','Mixed'),mixVarSub:P('混種三個品種','Three varieties mixed'),
 mixKeep:P('混種：保留不同的反應','Mixed: different responses kept'),
 note:P('示意，不是預測任何物種的存活','Schematic, not a survival forecast')
};
// beetle kinds (base colour names as in the frogs view)
const KINDS={
 orange:{f:'orange0',name:P('底色：橘','Orange'),sw:'#eb9e2a'},
 red:{f:'patch',name:P('底色：紅','Red'),sw:'#d8432a'},
 black:{f:'black2red',name:P('底色：黑','Black'),sw:'#2b3136'},
 pale:{f:'pale',name:P('底色：淡黃','Pale yellow'),sw:'#f2c98f'}
};
const LEFT_ROWS=['orange','orange','orange'],RIGHT_ROWS=['red','black','pale'];
// crop varieties
const VAR=[{name:P('品種一：綠','Variety 1: green'),col:'#6fcf5a'},{name:P('品種二：黃綠','Variety 2: yellow-green'),col:'#c6e14b'},{name:P('品種三：深綠','Variety 3: dark green'),col:'#2f9a55'}];
const FILE=kind=>E+'BD1_ladybird_'+KINDS[kind].f+'.png';

// ── layout ────────────────────────────────────────────────────────────────
const CARD={x:652,y:16,w:292,h:550};
const G=[{x:24,y:96,w:296,h:364},{x:336,y:96,w:296,h:364}];
const ROW0=84,ROWH=92,ICON_H=42,CELL=66;
const rowTop=(g,r)=>G[g].y+ROW0+r*ROWH;
const cellX=(g,j)=>G[g].x+16+CELL/2+j*CELL;
const Y_LEG=468,Y_STATE=516;
const SUN={x:612,y:44},THERMO={x:572,top:16},HYPH={x:592,y:52},ICON_LAB_R=540;
// which rows are affected in each step: [left rows], [right rows]
const HITS=[[[],[]],[[0,1,2],[1]],[[0,1,2],[2]],[[0,1,2],[0]]];

// ── helpers (same as the frogs view) ──────────────────────────────────────
const withA=(c,a,fn)=>{if(a<=0.002)return;c.save();c.globalAlpha*=Math.min(1,a);fn();c.restore();};
function balW(c,str,w,size){const n=K.splitLines(c,str,w,size).length;if(n<2)return w;let lo=w*.4,hi=w;
  for(let i=0;i<14;i++){const m=(lo+hi)/2;if(K.splitLines(c,str,m,size).length>n)lo=m;else hi=m;}return Math.ceil(hi)+1;}
function blines(c,p,w,size=22){const str=D.tr(p),zh=/[一-鿿]/.test(str),rows=[];let row='';
  for(const part of str.split(/(?<=[：，])|(?<=[:,] )|​/)){
    if(measure(c,(row+part).trimEnd(),size)<=w){row+=part;continue;}
    if(row.trim())rows.push(row.trimEnd());
    if(measure(c,part.trimEnd(),size)<=w)row=part;
    else{const r=K.splitLines(c,part.trim(),zh?w:balW(c,part.trim(),w,size),size);row=r.pop();rows.push(...r);}}
  if(row.trim())rows.push(row.trimEnd());return rows;}
const bwrap=(c,p,x,y,w,size,col,lh)=>{const r=blines(c,p,w,size);r.forEach((q,i)=>text(c,q,x,y+i*lh,size,col));return r.length*lh;};
function tag(c,p,x,y,{al='left',col=WHITE,active=false,size=22,fill='rgba(11,26,21,.92)'}={}){
  const w=measure(c,p,size)+28,h=size+18,bx=al==='right'?x-w:al==='center'?x-w/2:x;
  D.round(c,bx,y,w,h,h/2,active?col:fill,active?WHITE:rgba(col,.9));
  text(c,p,bx+w/2,y+h/2+size*.36,size,active?C.deep:col,'center');
  return{x:bx,y,w,h};
}
function ring(c,r,t,col){const u=mod(t*.7);D.round(c,r.x-6*u,r.y-6*u,r.w+12*u,r.h+12*u,Math.min(r.h/2,16)+6*u,null,rgba(col,.8*(1-u)));}
function badge(c,n,x,y,active,col=WHITE){circle(c,x,y,15,active?col:'rgba(11,26,21,.92)',active?col:rgba(MUTED,.8),2);
  c.save();c.font=K.MONO(22);c.fillStyle=active?C.ink:MUTED;c.textAlign='center';c.textBaseline='middle';c.fillText(String(n),x,y+1);c.restore();}
function stroke(c,r,col,w=3,rad=12){c.save();c.lineWidth=w;c.strokeStyle=col;c.beginPath();c.roundRect(r.x,r.y,r.w,r.h,rad);c.stroke();c.restore();}
// a beetle icon, dimmed when affected
function bee(c,kind,cx,cy,h,t,ph,dark,a=1){const [W,H]=K.dim(FILE(kind)),b=1+.025*Math.sin(t*1.8+ph)*(1-dark),hh=h*b,ww=hh*W/H;
  withA(c,a*(1-.62*dark),()=>K.drawIn(c,FILE(kind),{x:cx-ww/2,y:cy-hh/2,w:ww,h:hh}));}
// a survival dot: green (fine) -> dark grey-green (affected)
function dot(c,x,y,dark,t,ph){
  const r=7;if(dark<1){const g=.5+.5*Math.sin(t*2.2+ph);circle(c,x,y,r+3+2*g,null,rgba(FINE,.35*(1-dark)*(.5+.5*g)),2);}
  const n=parseInt(FINE.slice(1),16),m=parseInt(HIT.slice(1),16),ch=s=>Math.round(mix(n>>s&255,m>>s&255,dark));
  circle(c,x,y,r,`rgb(${ch(16)},${ch(8)},${ch(0)})`,dark>.5?HIT_EDGE:null,2);
}
// a crop plant in its plot: stalk, two leaves, grain head; wilts when affected
function plant(c,cx,base,col,dark,t,ph){
  const lean=.08*Math.sin(t*1.3+ph)*(1-dark)+.75*dark,h=22*(1-.15*dark);
  c.save();c.translate(cx,base);c.rotate(lean*.5);
  const cl=dark>.01?`rgba(${hexMix(col,'#5f6a52',dark)},1)`:col;
  K.sline(c,[[0,0],[0,-h]],cl,3);
  c.save();c.translate(0,-h*.45);c.rotate(-.7-.5*dark);K.ellipse(c,7,0,7,3,cl,null);c.restore();
  c.save();c.translate(0,-h*.6);c.rotate(.7+.5*dark);K.ellipse(c,-7,0,7,3,cl,null);c.restore();
  c.save();c.translate(0,-h);c.rotate(lean);K.ellipse(c,0,-5,4,6.5,cl,null);c.restore();
  c.restore();
}
function hexMix(a,b,u){const p=parseInt(a.slice(1),16),q=parseInt(b.slice(1),16),ch=s=>Math.round(mix(p>>s&255,q>>s&255,u));return `${ch(16)},${ch(8)},${ch(0)}`;}
// change A icon: sun + thermometer (drawn), orange = pressure
function sun(c,x,y,t,s=1){c.save();c.translate(x,y);c.scale(s,s);
  for(let i=0;i<10;i++){const a=i/10*Math.PI*2+t*.4,r0=21,r1=29+2*Math.sin(t*3+i);K.sline(c,[[r0*Math.cos(a),r0*Math.sin(a)],[r1*Math.cos(a),r1*Math.sin(a)]],ORANGE,3);}
  circle(c,0,0,16,'#fdba74',ORANGE,3);c.restore();}
function thermo(c,cx,top,t,tubeH=50,s=1){c.save();c.translate(cx,top);c.scale(s,s);
  const lv=.82+.06*Math.sin(t*1.5);
  D.round(c,-8,0,16,tubeH+6,8,'rgba(11,26,21,.9)',WHITE);
  circle(c,0,tubeH+12,13,'rgba(11,26,21,.9)',WHITE,2);circle(c,0,tubeH+12,8.5,ORANGE,null);
  const fh=(tubeH-6)*lv;D.round(c,-3.5,tubeH+4-fh,7,fh+6,3.5,ORANGE,null);
  for(let i=1;i<=3;i++)K.sline(c,[[8,i*tubeH/4],[14,i*tubeH/4]],rgba(WHITE,.7),2);
  c.restore();}
// change B icon: branching hyphae with spores (a fungus-like disease), swaying
function hyphae(c,x,y,t,s=1){c.save();c.translate(x,y);c.scale(s,s);
  const br=(x0,y0,a,len,d)=>{if(d>3)return;const sw=.12*Math.sin(t*1.4+d+a),x1=x0+len*Math.cos(a+sw),y1=y0+len*Math.sin(a+sw);
    K.sline(c,[[x0,y0],[x1,y1]],d<2?ORANGE:'#fdba74',4-d*.7);
    if(d===3){circle(c,x1,y1,3.5+.8*Math.sin(t*2+a*3),'#fed7aa',null);return;}
    br(x1,y1,a-.55,len*.72,d+1);br(x1,y1,a+.5,len*.72,d+1);};
  br(0,30,-Math.PI/2,20,0);br(-6,30,-Math.PI/2-.9,15,1);br(6,30,-Math.PI/2+.9,15,1);
  K.sline(c,[[-26,32],[26,32]],rgba(ORANGE,.7),3);
  c.restore();}

// ── frame ─────────────────────────────────────────────────────────────────
const s_dbg={};
function draw(c,s,t){
  const {k}=K.stageClock(s,t,N,PER);
  s.shown=k;
  const st=s.responseSt||(s.responseSt={});
  if(st.k===undefined){st.k=k;st.from=-1;st.T=t-20;st.start=s.start;}
  if(st.k!==k){st.from=st.k;st.k=k;st.T=t;st.start=s.start;}
  else if(st.start!==s.start){st.start=s.start;st.from=-1;st.T=t;}   // the same step clicked again: replay it
  if(t<st.T){st.T=t;st.from=-1;}
  const tau=t-st.T,x=clamp(tau/MOVE),moving=st.from>=0&&x<1,u=moving?smooth(x):1;
  const at=(d,dur=.45)=>clamp((tau-d)/dur);
  const sc=j=>j<=2?0:1,swap=moving&&sc(st.from)!==sc(k);
  const sceneA=n=>swap?(sc(k)===n?smooth(clamp(x*2-1)):sc(st.from)===n?1-smooth(clamp(x*2)):0):(sc(k)===n?1:0);
  // darkness of icon (g, row r, column j) in step kk at time tau (entering) / fully (leaving)
  const hitIn=(kk,g,r)=>HITS[kk][g].includes(r);
  const darkNow=(g,r,j)=>{if(!hitIn(k,g,r))return 0;const order=g===0?r*4+j:j;return at(1.4+order*.12,.5);};
  const dark=(g,r,j)=>{const now=darkNow(g,r,j);if(!moving||sc(st.from)!==sc(k))return now;const was=hitIn(st.from,g,r)?1:0;return Math.min(mix(was,0,u)+now,1);};
  // stage elements that cross-fade between two steps of the same scene
  const keyA=kk=>kk===1||kk===3,keyB=kk=>kk===2;
  // the change icon: the old one fades out in the first half of the move, the new one fades in after (they share a place)
  const icon=key=>moving?(key(st.from)&&!key(k)?1-smooth(clamp(x*2)):key(k)&&!key(st.from)?smooth(clamp(x*2-1)):key(k)?1:0):(key(k)?at(.3,.6):0);
  const iconA=icon(keyA),iconB=icon(keyB);

  // ── top band: the year / the change ──
  const pillP=[T.normal,T.changeA,T.changeB,T.changeC][k],pillC=k===0?WHITE:ORANGE;
  const pa=moving&&st.from>=0?clamp(x*1.6-.6):1;
  if(moving&&st.from>=0)withA(c,1-clamp(x*2.5),()=>tag(c,[T.normal,T.changeA,T.changeB,T.changeC][st.from],24,24,{col:st.from===0?WHITE:ORANGE,active:true}));
  withA(c,pa,()=>{const r=tag(c,pillP,24,24,{col:pillC,active:true});if(k>0)ring(c,r,t,pillC);});
  withA(c,iconA,()=>{sun(c,SUN.x,SUN.y,t);thermo(c,THERMO.x,THERMO.top,t);text(c,T.heat,ICON_LAB_R,62,22,ORANGE,'right');});
  withA(c,iconB,()=>{hyphae(c,HYPH.x,HYPH.y-10,t);text(c,T.disease,ICON_LAB_R+4,62,22,ORANGE,'right');});

  // ── scene 0: ladybird groups ──
  const a0=sceneA(0);
  if(a0>0)withA(c,a0,()=>groups(c,'bee',k,t,tau,at,dark));
  // ── scene 1: crops ──
  const a1=sceneA(1);
  if(a1>0)withA(c,a1,()=>groups(c,'crop',k,t,tau,at,dark));

  // legend row (stage): what the dots mean
  let lx=24;[[0,T.fine],[1,T.hit]].forEach(([d,p])=>{const w=measure(c,p,22)+58;D.round(c,lx,Y_LEG,w,40,20,'rgba(11,26,21,.92)',rgba(WHITE,.5));
    dot(c,lx+22,Y_LEG+20,d,t,0);text(c,p,lx+40,Y_LEG+28,22,WHITE);lx+=w+12;});
  // statements
  const sA=k===2?at(4.2,.6):(moving&&st.from===2?1-u:0);
  withA(c,sA,()=>{const r=tag(c,T.noBest,24,Y_STATE,{col:WHITE,active:true});if(k===2)ring(c,r,t,WHITE);});
  const sB=k===3?at(4.2,.6):(moving&&st.from===3?1-u:0);
  withA(c,sB,()=>{const r=tag(c,T.mixKeep,24,Y_STATE,{col:PINK});if(k===3)ring(c,r,t,PINK);});

  // ── step card (right) ──
  card(c,k,st,moving,x,u,tau,t);

  // notes (all steps): schematic note always; AI note while the beetles are shown
  text(c,T.note,24,592,22,MUTED,'left');
  withA(c,sceneA(0),()=>text(c,L('aiNote','AI 插圖，非實拍','AI illustration, not a photo'),CW-12,592,22,MUTED,'right'));
}

// both groups of one scene ('bee' = ladybirds, 'crop' = small grid fields)
function groups(c,mode,k,t,tau,at,dark){
  const crop=mode==='crop';
  G.forEach((g,gi)=>{
    const appear=k===0&&!crop?at(.2+gi*.3,.5):k===3&&crop?at(MOVE*.5+gi*.3,.5):1;
    withA(c,appear,()=>{
      D.round(c,g.x,g.y,g.w,g.h,16,'rgba(22,51,43,.88)',null);
      stroke(c,g,gi?PINK:rgba(WHITE,.75),3,16);
      const head=crop?(gi?T.mixVar:T.oneVar):(gi?T.more:T.less),sub=crop?(gi?T.mixVarSub:T.oneVarSub):(gi?T.moreSub:T.lessSub);
      tag(c,head,g.x+12,g.y+12,{col:gi?PINK:WHITE,active:true});
      text(c,sub,g.x+16,g.y+76,22,gi?PINK:WHITE);
    });
    for(let r=0;r<3;r++){
      const top=rowTop(gi,r),ra=k===0&&!crop?at(.6+gi*.3+r*.25,.5):k===3&&crop?at(MOVE+gi*.3+r*.25,.5):1;
      withA(c,ra,()=>{
        // row label: colour swatch + name
        if(crop){const v=VAR[gi?r:0];D.round(c,g.x+16,top+3,18,18,4,v.col,C.ink);text(c,v.name,g.x+42,top+20,22,WHITE);}
        else{const kd=KINDS[(gi?RIGHT_ROWS:LEFT_ROWS)[r]];circle(c,g.x+25,top+12,9,kd.sw,WHITE,2);text(c,kd.name,g.x+42,top+20,22,WHITE);}
        // change badges on the mixed / more-varied side: which change hit this row
        if(gi===1&&!crop){[[1,'A'],[2,'B']].forEach(([kk,ch])=>{if(!HITS[kk][1].includes(r))return;
          const on=k===kk?at(1.4,.4):0,past=k>kk?1:0;if(on+past<=0)return;
          withA(c,Math.max(on,past),()=>{const bx=g.x+g.w-28,by=top+12;circle(c,bx,by,13,on>0?ORANGE:'rgba(11,26,21,.92)',on>0?ORANGE:rgba(ORANGE,.8),2);
            c.save();c.font=K.MONO(22);c.fillStyle=on>0?C.ink:ORANGE;c.textAlign='center';c.textBaseline='middle';c.fillText(ch,bx,by+1);c.restore();});});}
        // survival strip
        D.round(c,g.x+16,top+67,g.w-32,22,11,'rgba(11,26,21,.75)',rgba(WHITE,.25));
        for(let j=0;j<4;j++){
          const cx=cellX(gi,j),dk=dark(gi,r,j),ph=gi*3+r*1.3+j*.7;
          if(crop){D.round(c,cx-29,top+24,58,40,6,'#3a3427',rgba(WHITE,.18));const v=VAR[gi?r:0];plant(c,cx-12,top+60,v.col,dk,t,ph);plant(c,cx+12,top+60,v.col,dk,t,ph+.8);}
          else bee(c,(gi?RIGHT_ROWS:LEFT_ROWS)[r],cx,top+45,ICON_H,t,ph,dk);
          dot(c,cx,top+78,dk,t,ph);
        }
      });
    }
  });
}

function card(c,k,st,moving,x,u,tau,t){
  const R=CARD,ix=R.x+16,iw=R.w-32;
  D.round(c,R.x,R.y,R.w,R.h,14,'rgba(22,51,43,.95)',C.edge);
  const hr=tag(c,L('genetic','遺傳多樣性','Genetic diversity'),ix,R.y+14,{col:PINK});
  let y=R.y+14+hr.h+30;
  y+=bwrap(c,T.keep,ix,y,iw,22,PINK,28)+4;
  K.sline(c,[[ix,y],[ix+iw,y]],rgba(WHITE,.25),2);y+=12;
  T.short.forEach((p,j)=>{
    const on=j===k?(moving?u:1):(moving&&j===st.from?1-u:0),cy=y+20;
    if(on>0)withA(c,on,()=>D.round(c,ix-6,y,iw+12,40,12,'rgba(242,236,217,.10)',null));
    badge(c,j+1,ix+16,cy,false);withA(c,on,()=>badge(c,j+1,ix+16,cy,true));
    text(c,p,ix+42,cy+8,22,on>.5?WHITE:MUTED);
    y+=42;});
  K.sline(c,[[ix,y+2],[ix+iw,y+2]],rgba(WHITE,.25),2);y+=16;
  const ty=y+22;
  if(moving&&st.from>=0)withA(c,1-clamp(x*2.5),()=>bwrap(c,T.names[st.from],ix,ty,iw,22,WHITE,30));
  const na=clamp((tau-(moving?MOVE*.6:0))/.5);
  const hh=blines(c,T.names[k],iw).length*30;withA(c,na,()=>bwrap(c,T.names[k],ix,ty,iw,22,WHITE,30));
  const legs=legend(k),lhs=legs.map(([,p])=>Math.max(44,K.splitLines(c,D.tr(p),iw-50,22).length*28+16)),ly=R.y+R.h-12-lhs.reduce((a,b)=>a+b,0);
  s_dbg.title=ty+hh-22;s_dbg.legend=ly;
  const fade=moving&&st.from>=0&&JSON.stringify(legend(st.from).map(l=>l[0]))!==JSON.stringify(legs.map(l=>l[0]))?u:1;
  if(!legs.length)return;
  withA(c,fade,()=>{let yy=ly;legs.forEach(([kind,p],q)=>{swatch(c,kind,ix,yy,t);K.wrap(c,p,ix+50,yy+28,iw-50,22,WHITE,28);yy+=lhs[q];});});
}
function legend(k){
  // fine / affected are named on the stage (legend row); the card names the change only
  if(k===1||k===3)return[['sun',T.heat]];
  if(k===2)return[['hyph',T.disease]];
  return[];
}
function swatch(c,kind,x,y,t){
  if(kind==='fine')dot(c,x+18,y+20,0,t,0);
  else if(kind==='hit')dot(c,x+18,y+20,1,t,0);
  else if(kind==='sun')sun(c,x+18,y+20,t,.62);
  else if(kind==='hyph')hyphae(c,x+18,y+6,t,.62);
}
window.EnvironmentDraw=window.EnvironmentDraw||{};
window.EnvironmentDraw.response=draw;
window.EnvironmentDraw.response.dbg=s_dbg;
})();
