/* Fungi · "molds" canvas (Tab 3, view 1: moulds and spores), 2026-10-22.
 * Registers window.FungiDraw.molds; called as draw(ctx, state, t) on the 960x600 canvas. Sets s.shown (stage 0..5).
 * Pictures (AI teaching illustrations, fungi_ai_1022/; positions are PNG pixels from measurements.json times the scale):
 *   bread_mold.png, sporangia_pair.png, sporangium_closed.png, sporangium_open.png, orange_mold.png, penicillium_brush.png,
 *   mushroom_cap_only.png (crop [.24,0,.56,.43] = the whole group; the spec crop [.24,0,.34,.42] cuts the tallest cap in half), bt:yeast_budding.png.
 * Step 1: the mouldy bread (its flat-cut left end and the cut stalk ends of the sporangia are faded out in copies made once,
 *   sources.md 6); a round close-up of four black dots (4x, still pins, not mushrooms); hyphae / sporangia / bread; warning.
 * Step 2: the bread shrinks to the lower left; from the isolated dot (504,549) a panel grows with sporangia_pair.png and a
 *   piece of food drawn in code under the rhizoids (they reach into it); sporangium, spores, stalk, rhizoids, food.
 * Step 3: sporangium_closed.png cross-fades into sporangium_open.png with the sphere centres aligned ((170,171) -> (188,187));
 *   grey spores (drawn in code, 19 px x scale) keep drifting out of the opening to the upper right; one spore lands on a small
 *   piece of bread (drawn in code) and grows new cream hyphae; corner note: size and number of spores are a sketch.
 * Step 4: the mouldy orange on the right, labels on the left; warning and the food-strain note at the bottom.
 * Step 5: the orange shrinks to the lower left; from the mould spot a panel grows with penicillium_brush.png; stalk, branches,
 *   spore chain, one spore, hyphae. The 173 spore beads (found by program, distance-transform peaks) light up in a wave by
 *   distance from the branch base (470,640) outwards, i.e. from the base of each chain to its tip, without using where the
 *   chains cross (sources.md "待老師看" 11).
 * Step 6: three columns (yeast / moulds / mushroom fungi); a yellow frame slides from column to column inside the step.
 * Every step: tappable step markers (lower right). The page shell owns the animation loop; this module keeps no timer.
 */
(()=>{'use strict';
const K=window.FungiKit,{P,C,D,text,measure,splitLines,rgba,clamp,mix,ease,smooth,fade,stageClock,drawIn,fitRect,circle,ellipse,line,sline,dashed,glow,mod,marker,rng,MONO,TAU}=K;
const N=6,PER=8;
const BREAD='bread_mold.png',PAIR='sporangia_pair.png',CLOSED='sporangium_closed.png',OPEN='sporangium_open.png',
  ORANGE='orange_mold.png',BRUSH='penicillium_brush.png',CAPS='mushroom_cap_only.png',YEAST='bt:yeast_budding.png';
const SZ=f=>K.SIZE[f];

// ── words (canvas labels; verbatim from animation_specs.md unless marked "added") ─
const T={
 fluff:P(`白色棉絮：菌絲`,`White fluff: hyphae`),dots:P(`黑色小點：孢子囊`,`Black dots: sporangia`),bread:P(`麵包`,`Bread`),
 warn1:P(`發霉的食物不要聞、不要吃`,`Do not sniff or eat mouldy food`),
 sporangium:P(`孢子囊`,`Sporangium`),stalk:P(`柄`,`Stalk`),rhizoids:P(`假根`,`Rhizoids`),food:P(`食物`,`Food`),
 rhizNote:P(`假根伸進食物，也分泌酵素、吸收養分`,`Rhizoids reach into the food and release enzymes to absorb nutrients`),
 spores:P(`孢子`,`Spores`),split:P(`孢子囊破開`,`Sporangium splits open`),
 newFood:P(`落在新食物上，長出新的菌絲`,`On new food, a spore grows new hyphae`),
 sketch:P(`孢子的大小與數量只是示意`,`Size and number of spores are a sketch`),
 teal:P(`藍綠色：孢子`,`Blue-green: spores`),white:P(`白色：菌絲`,`White: hyphae`),peel:P(`橘子皮`,`Orange peel`),
 warn4:P(`不要自己培養、打開、近聞或吃發霉的材料`,`Never grow, open, sniff or eat mouldy material`),
 strain:P(`特定的青黴菌種可用在食品製造，不表示自然發霉的食物可以吃`,`Certain Penicillium strains are used in food making; that does not make food that has gone mouldy by itself safe`),
 branches:P(`分枝（像刷子）`,`Branches\n(like a brush)`),chain:P(`孢子鏈`,`Spore chain`),spore:P(`孢子`,`Spore`),
 notMush:P(`不是所有真菌都長得像蘑菇`,`Not every fungus looks like a mushroom`),
 // added (so that nothing on the canvas is unnamed)
 ai:P(`AI 插圖，示意`,`AI sketch`),
 oneDot:P(`麵包上的一個黑點`,`One black dot on the bread`),
 spotFrom:P(`橘子上的黴斑`,`The mould spot on the orange`),
 hyphae:P(`菌絲`,`Hyphae`)};
const COLS=[
 {name:P(`酵母菌`,`Yeast`),pic:YEAST,lines:[P(`單細胞`,`Single-celled`),P(`不是由菌絲組成`,`Not made of hyphae`)],ex:P(`例子：酵母菌`,`Example: yeast`)},
 {name:P(`黴菌`,`Moulds`),pic:BRUSH,lines:[P(`由菌絲組成`,`Made of hyphae`),P(`常長成絨毛狀，靠孢子繁殖`,`Often fluffy; reproduce by spores`)],ex:P(`例子：黑黴、青黴`,`Examples: black mould, Penicillium`)},
 {name:P(`蕈類`,`Mushroom fungi`),pic:CAPS,crop:[.24,0,.56,.43],lines:[P(`由菌絲組成`,`Made of hyphae`),P(`看得見的菇是子實體，會產生孢子`,`The mushroom you see is a fruiting body that makes spores`)],ex:P(`例子：香菇、靈芝`,`Examples: shiitake, reishi`)}];
const SPORE='#6b6f73',SPORE_D='#2f3437',SPORE_H='#c9ccce',FOOD='#c8955f',FOOD_D='#a3713f',FOOD_T='#e2b47c';

// ── measured points (PNG pixels) ───────────────────────────────────────────
const ZB=[530,510],ZBR=62;                                      // step 1 close-up: (546,464) (504,497) (559,521) (504,549)
const ZDOTS=[[546,464],[504,497]];
const FLUFF=[1000,450],CRUST=[900,700];
const DOT=[504,549];                                            // isolated black head (step 2 source)
const PAIR_SPH=[961,209],PAIR_SPORES=[905,455],PAIR_STALK=[632,700],PAIR_RHIZ=[960,1000],FOOD_TOP=925;
const ORA_C=[416,392],ORA_W=[225,460],ORA_P=[160,600];
const BEADS=[[430,19],[538,27],[445,33],[526,43],[459,49],[207,57],[513,61],[472,66],[225,68],[241,79],[257,92],[273,106],[841,114],[504,115],[287,119],[475,130],[513,134],[846,134],[467,149],[312,152],[520,153],[849,154],[21,166],[460,167],[321,169],[736,171],[42,172],[526,172],[716,174],[851,175],[60,178],[696,179],[676,185],[453,186],[78,187],[331,188],[531,192],[657,192],[853,195],[97,197],[638,201],[168,202],[189,202],[210,204],[448,205],[113,206],[231,208],[621,211],[251,212],[537,212],[342,213],[130,216],[853,216],[605,223],[441,224],[145,227],[291,228],[540,230],[878,231],[348,232],[589,236],[161,238],[309,238],[824,240],[438,245],[805,246],[325,249],[175,250],[544,250],[573,250],[786,253],[847,256],[190,261],[766,261],[438,265],[652,266],[73,268],[748,270],[205,274],[842,275],[731,281],[643,284],[438,286],[79,288],[219,288],[715,293],[835,293],[635,302],[233,303],[551,305],[700,305],[88,306],[438,306],[523,307],[827,309],[626,321],[686,321],[98,325],[513,325],[817,327],[438,328],[552,329],[369,338],[672,338],[619,339],[264,340],[110,341],[807,344],[400,347],[440,347],[503,348],[553,350],[660,355],[278,356],[127,360],[613,360],[794,361],[534,362],[464,365],[498,366],[582,367],[406,368],[648,371],[141,373],[291,374],[781,376],[530,379],[606,379],[407,383],[497,383],[157,384],[340,384],[465,384],[579,385],[551,388],[766,390],[635,393],[304,394],[172,395],[528,396],[497,399],[408,401],[347,402],[465,402],[752,403],[574,404],[600,404],[187,405],[293,408],[434,422],[549,408],[655,410],[625,411],[737,416],[202,417],[353,417],[301,424],[570,425],[218,428],[274,428],[644,428],[613,432],[364,437],[234,440],[285,443],[635,445],[674,445],[711,445],[249,452],[369,453],[697,460],[662,461],[264,467]];
const BASE=[470,640],BEAD_D=BEADS.map(([x,y])=>Math.hypot(x-BASE[0],y-BASE[1])),D0=210,D1=655;
const BR_SPORE=[841,114],BR_CHAIN=[748,270],BR_STALK=[465,850],BR_BRANCH=[380,560],BR_HY=[640,1200];

// ── layouts (canvas) ───────────────────────────────────────────────────────
const L1={x:40,y:60,sc:.47};                     // step 1 bread
const L2={x:24,y:392,sc:.2};                     // step 2 bread (small)
const Z1={x:790,y:205,r:120};                    // step 1 close-up circle
const PAN2={x:300,y:20,w:440,h:528},L2P={x:315,y:36,sc:.37};
const S3={cx:300,cy:200,sc:.6};                  // step 3 sphere centre
const SLAB={x:650,y:402,w:250,d:46};             // step 3 new food
const L4={x:470,y:20,sc:.56};                    // step 4 orange (right)
const L5={x:24,y:446,sc:.165};                   // step 5 orange (small)
const PAN5={x:244,y:20,w:412,h:560},L5P={x:253,y:25,sc:.44};
const MK_X=706,MK_DX=42,MK_Y=566;
const at=(L,p)=>[L.x+p[0]*L.sc,L.y+p[1]*L.sc];
const rectOf=(L,f)=>({x:L.x,y:L.y,w:SZ(f)[0]*L.sc,h:SZ(f)[1]*L.sc});
const lerpL=(a,b,u)=>({x:mix(a.x,b.x,u),y:mix(a.y,b.y,u),sc:mix(a.sc,b.sc,u)});

// ── helpers ────────────────────────────────────────────────────────────────
function track(s,key,k,t,dur){
  let o=s[key];if(!o||t<o.t){o=s[key]={k,from:k,t:t-9};}
  if(o.k!==k){o.from=o.k;o.k=k;o.t=t;}
  return{from:o.from,u:ease((t-o.t)/dur)};
}
function rowsOf(c,p,w,size=22){
  const str=D.tr(p),out=[];
  for(const part of str.split('\n')){
    const rows=splitLines(c,part,w,size);
    for(let i=0;i<rows.length-1;i++)if(/[（(]$/.test(rows[i])){rows[i]=rows[i].slice(0,-1).trimEnd();rows[i+1]=(/（/.test(part)?'（':'(')+rows[i+1];}
    out.push(...rows);
  }
  return out;
}
// A label: rows with the top at y; leaders from the nearest side to each target.
function tag(c,p,x,y,{col=C.white,align='left',maxW=240,tgts=[],a=1,size=22,dot=true}={}){
  if(a<=.004)return null;
  const rows=rowsOf(c,p,maxW,size),lh=size+6,w=Math.max(...rows.map(r=>measure(c,r,size))),h=rows.length*lh;
  const x0=align==='left'?x:align==='right'?x-w:x-w/2;
  c.save();c.globalAlpha*=a;
  for(const [tx,ty] of tgts){
    let sx,sy;
    if(tx<x0-4){sx=x0-6;sy=y+Math.min(h/2,lh*.55);}else if(tx>x0+w+4){sx=x0+w+6;sy=y+Math.min(h/2,lh*.55);}
    else if(ty>y+h){sx=tx;sy=y+h+4;}else{sx=tx;sy=y-4;}
    line(c,[[sx,sy],[tx,ty]],rgba(col,.9),2);if(dot)circle(c,tx,ty,4.5,col,C.ink,1.5);
  }
  const al=align==='left'?'left':align==='right'?'right':'center';
  rows.forEach((r,i)=>text(c,r,x,y+size-1+i*lh,size,col,al));
  c.restore();
  return{x0,y,w,h};
}
function warning(c,p,x,yTop,w,a,col=C.orange){
  if(a<=.004)return 0;
  const rows=rowsOf(c,p,w-34,22);
  c.save();c.globalAlpha*=a;
  c.beginPath();c.moveTo(x+12,yTop+3);c.lineTo(x+24,yTop+25);c.lineTo(x,yTop+25);c.closePath();c.fillStyle=col;c.fill();
  line(c,[[x+12,yTop+10],[x+12,yTop+17]],C.ink,2.6);circle(c,x+12,yTop+21.5,1.6,C.ink,null);
  rows.forEach((r,i)=>text(c,r,x+34,yTop+21+i*28,22,col,'left'));
  c.restore();return rows.length*28;
}
const canvas=(w,h)=>{const cv=document.createElement('canvas');cv.width=w;cv.height=h;return cv;};
// Copies of a picture with an edge faded out (cut edges never show). side: 'left' or 'bottom'; n = PNG px of the ramp.
const FADED={};
function faded(file,side,n){
  const key=file+side;if(FADED[key])return FADED[key];
  const im=K.pic(K.URL_OF(file));if(!im)return null;
  const [W,H]=SZ(file),cv=canvas(W,H),x=cv.getContext('2d');x.drawImage(im,0,0,W,H);
  x.globalCompositeOperation='destination-out';
  const g=side==='left'?x.createLinearGradient(0,0,n,0):x.createLinearGradient(0,H,0,H-n);
  g.addColorStop(0,'rgba(0,0,0,1)');g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;
  if(side==='left')x.fillRect(0,0,n,H);else x.fillRect(0,H-n,W,n);
  return FADED[key]=cv;
}
function drawFaded(c,file,side,n,r,a=1){
  if(a<=.004)return;
  const cv=faded(file,side,n);
  if(!cv){drawIn(c,file,r,{alpha:a});return;}
  c.save();c.globalAlpha*=a;c.drawImage(cv,r.x,r.y,r.w,r.h);c.restore();
}
// dashed connectors from a ring to a target (circle or rect)
function connectors(c,sx,sy,sr,pts,a,t){
  if(a<=.004)return;
  c.save();c.globalAlpha*=a;c.setLineDash([7,6]);c.lineDashOffset=-t*10;
  for(const [x,y] of pts){const an=Math.atan2(y-sy,x-sx);line(c,[[sx+sr*Math.cos(an),sy+sr*Math.sin(an)],[x,y]],rgba(C.yellow,.6),2);}
  c.restore();
}
function ring(c,x,y,r,a,t){if(a<=.004)return;c.save();c.globalAlpha*=a;circle(c,x,y,r,null,rgba(C.yellow,.95),3);K.pulse(c,x,y,t,C.yellow,r);c.restore();}
function aiNote(c,a){if(a<=.004)return;c.save();c.globalAlpha*=a;text(c,T.ai,20,44,22,C.muted,'left');c.restore();}

// ── step 1: mouldy bread ───────────────────────────────────────────────────
function step1(c,a,tau,t){
  const L=L1,r=rectOf(L,BREAD),br=Math.sin(t*.8)*.003;
  drawFaded(c,BREAD,'left',90,{x:r.x-r.w*br/2,y:r.y-r.h*br/2,w:r.w*(1+br),h:r.h*(1+br)},a*fade(tau,0,.8));
  // close-up of four black dots
  const za=a*fade(tau,.6,.4),zu=ease((tau-.6)/1.2),src=at(L,ZB),sr=ZBR*L.sc;
  if(za>0){
    const x=mix(src[0],Z1.x,zu),y=mix(src[1],Z1.y,zu),R=mix(sr,Z1.r,zu),k=R/ZBR;
    ring(c,src[0],src[1],sr,za,t);
    const an=Math.atan2(y-src[1],x-src[0]);
    connectors(c,src[0],src[1],sr,[-1,1].map(d=>[x+R*Math.cos(an+d*Math.PI/2),y+R*Math.sin(an+d*Math.PI/2)]),za,t);
    c.save();c.globalAlpha*=za;circle(c,x,y,R,C.panel,null);
    c.beginPath();c.arc(x,y,R,0,TAU);c.clip();
    const [W,H]=SZ(BREAD);drawIn(c,BREAD,{x:x-R,y:y-R,w:2*R,h:2*R},{crop:[(ZB[0]-ZBR)/W,(ZB[1]-ZBR)/H,2*ZBR/W,2*ZBR/H]});
    c.restore();
    c.save();c.globalAlpha*=za;circle(c,x,y,R,null,rgba(C.yellow,.95),3);c.restore();
    const la=a*fade(tau,1.9,.5);
    if(la>0){
      const pts=ZDOTS.map(p=>[x+(p[0]-ZB[0])*k,y+(p[1]-ZB[1])*k]);
      c.save();c.globalAlpha*=la;pts.forEach((p,i)=>circle(c,p[0],p[1],14+1.5*Math.sin(t*2.4+i),null,C.yellow,2.5));c.restore();
      tag(c,T.dots,664,28,{col:C.yellow,size:24,maxW:270,a:la,dot:false,tgts:pts.map(p=>[p[0],p[1]-14])});
    }
  }
  tag(c,T.fluff,664,352,{col:C.white,size:22,maxW:270,a:a*fade(tau,2.6,.5),tgts:[at(L,FLUFF)]});
  tag(c,T.bread,664,430,{col:'#e6c08a',size:22,maxW:270,a:a*fade(tau,3.2,.5),tgts:[at(L,CRUST)]});
  warning(c,T.warn1,40,512,620,a*fade(tau,3.8,.5));
  aiNote(c,a*fade(tau,.4,.5));
}

// ── step 2: one black mould enlarged ───────────────────────────────────────
function food2(c,top,x,w,bottom,t){
  // a block of food (drawn in code) whose top is at y = top
  c.save();c.beginPath();c.rect(x,top,w,bottom-top);c.fillStyle=FOOD;c.fill();
  const R=rng(2210);for(let i=0;i<46;i++){const px=x+R()*w,py=top+8+R()*(bottom-top-12);ellipse(c,px,py,3+R()*5,2+R()*3,rgba(FOOD_D,.55),null);}
  line(c,[[x,top],[x+w,top]],FOOD_T,4);c.restore();
}
function step2(c,a,tau,t){
  const gu=ease((tau-.2)/1.1),L=lerpL(L1,L2,gu),r=rectOf(L,BREAD);
  drawFaded(c,BREAD,'left',90,r,a);
  const src=at(L,DOT),sr=Math.max(14,26*L.sc*2.4);
  const ra=a*fade(tau,1.0,.4);ring(c,src[0],src[1],sr,ra,t);
  tag(c,T.oneDot,24,322,{col:C.yellow,size:22,maxW:250,a:a*fade(tau,1.3,.5)});
  // the panel grows out of the ring
  const pu=ease((tau-1.4)/1.2);
  if(pu>0){
    const P2=PAN2,cx=P2.x+P2.w/2,cy=P2.y+P2.h/2,k=mix(2*sr/P2.h,1,pu),x=mix(src[0],cx,pu),y=mix(src[1],cy,pu);
    const pa=a*clamp(pu*3);
    connectors(c,src[0],src[1],sr,[[x-P2.w/2*k,y+P2.h*.08*k],[x-P2.w/2*k,y+P2.h/2*k]],pa,t);
    c.save();c.globalAlpha*=pa;c.translate(x,y);c.scale(k,k);c.translate(-cx,-cy);
    D.round(c,P2.x,P2.y,P2.w,P2.h,18,C.panel,null);
    c.save();c.beginPath();c.roundRect(P2.x+2,P2.y+2,P2.w-4,P2.h-4,16);c.clip();
    const pr=rectOf(L2P,PAIR),fy=L2P.y+FOOD_TOP*L2P.sc,fb=fy+92;
    food2(c,fy,P2.x,P2.w,fb,t);
    drawIn(c,PAIR,pr);
    // the rhizoids are inside the food: a thin veil of food colour over them below the surface
    c.fillStyle=rgba(FOOD,.38);c.fillRect(P2.x,fy+2,P2.w,fb-fy-2);
    // enzymes (cyan) seeping from the rhizoid tips, nutrients (yellow) moving up
    const R=rng(55);
    for(let i=0;i<10;i++){const bx=P2.x+30+R()*(P2.w-60),ph=R();const v=mod(t*.35+ph);
      circle(c,bx+Math.sin(t+ph*9)*4,fy+16+v*60,2.6,rgba(C.cyan,.75*(1-v)),null);}
    c.restore();
    D.round(c,P2.x,P2.y,P2.w,P2.h,18,null,rgba(C.yellow,.9));
    c.restore();
  }
  const la=j=>a*fade(tau,2.6+j*.45,.5);
  tag(c,T.sporangium,756,92,{col:C.white,maxW:180,a:la(0),tgts:[at(L2P,PAIR_SPH)]});
  tag(c,T.spores,756,170,{col:C.white,maxW:180,a:la(1),tgts:[at(L2P,PAIR_SPORES)]});
  tag(c,T.stalk,756,262,{col:C.white,maxW:180,a:la(2),tgts:[at(L2P,PAIR_STALK)]});
  tag(c,T.rhizoids,756,338,{col:C.white,maxW:180,size:24,a:la(3),tgts:[at(L2P,PAIR_RHIZ)]});
  tag(c,T.food,756,430,{col:'#e6c08a',maxW:180,a:la(4),tgts:[[712,454]]});
  const na=a*fade(tau,4.8,.5);
  if(na>0){c.save();c.globalAlpha*=na;const rows=rowsOf(c,T.rhizNote,PAN2.w-32,22);
    rows.forEach((row,i)=>text(c,row,PAN2.x+PAN2.w/2,L2P.y+FOOD_TOP*L2P.sc+92+34+i*28,22,C.cyan,'center'));c.restore();}
  aiNote(c,a*fade(tau,.4,.5));
}

// ── step 3: the sporangium opens ───────────────────────────────────────────
const SP=[...Array(64)].map((_,i)=>{const R=rng(900+i*7);return{ph:R(),ex:R(),ey:R(),sp:.8+.4*R(),drift:(R()-.5)*.5,w:R()*TAU,sz:.85+.3*R()};});
const OPEN_EMIT=[[250,300],[345,330]];          // open PNG: lower right part of the spore pile, at the break
function sporeAt(o,age){
  const s=S3.sc,ox=S3.cx-188*s,oy=S3.cy-187*s;
  const x0=ox+mix(OPEN_EMIT[0][0],OPEN_EMIT[1][0],o.ex)*s,y0=oy+mix(OPEN_EMIT[0][1],OPEN_EMIT[1][1],o.ey)*s;
  const d=age*610*o.sp;
  return[x0+d*.9,y0-d*(.38+o.drift*.3)+Math.sin(age*6+o.w)*9-age*age*40];
}
function sporeDot(c,x,y,r,a=1){
  if(a<=.004)return;c.save();c.globalAlpha*=a;circle(c,x,y,r,SPORE,SPORE_D,1.2);circle(c,x-r*.35,y-r*.35,r*.3,rgba(SPORE_H,.8),null);c.restore();
}
function newHyphae(c,x,y,g,t){
  if(g<=0)return;
  const br=[[[0,0],[16,-2],[34,4],[52,1]],[[0,0],[-14,3],[-30,-1],[-44,4]],[[16,-2],[22,-12],[30,-16]],[[-14,3],[-20,-8]],[[34,4],[42,12]],[[-30,-1],[-36,8]]];
  c.save();br.forEach((b,i)=>{const v=clamp(g*1.8-i*.18);if(v<=0)return;const pts=b.map(([px,py])=>[x+px*v,y+py*v]);sline(c,pts,rgba(C.white,.92),2.6);});
  glow(c,x+52*g,y,8,C.white,.3+.2*Math.sin(t*3));c.restore();
}
function step3(c,a,tau,t){
  const s=S3.sc,ou=smooth((tau-1.3)/.9);
  const rc={x:S3.cx-170*s,y:S3.cy-171*s,w:SZ(CLOSED)[0]*s,h:SZ(CLOSED)[1]*s},ro={x:S3.cx-188*s,y:S3.cy-187*s,w:SZ(OPEN)[0]*s,h:SZ(OPEN)[1]*s};
  c.save();c.beginPath();c.rect(0,0,960,580);c.clip();
  drawFaded(c,CLOSED,'bottom',150,rc,a*(1-ou)*fade(tau,0,.6));
  drawFaded(c,OPEN,'bottom',150,ro,a*ou);
  c.restore();
  // a flash at the break when it opens
  const fl=Math.sin(Math.PI*clamp((tau-1.3)/1.0));
  if(fl>0){c.save();c.globalAlpha*=a*fl;glow(c,ro.x+250*s,ro.y+150*s,90,C.yellow,.5);c.restore();}
  // spores drift out to the upper right, without end
  const ts=tau-1.9;
  if(ts>0){c.save();c.globalAlpha*=a;
    for(const o of SP){const st=o.ph*3.6;if(ts<st)continue;const age=mod((ts-st)/3.6),[x,y]=sporeAt(o,age);
      const fa=clamp(age/.06)*clamp((935-x)/30)*clamp((y-24)/24);sporeDot(c,x,y,9.5*s*o.sz,fa);}
    c.restore();}
  // the one spore that lands on new food, and its new hyphae
  const sl=SLAB,lx=sl.x+sl.w*.42,ly=sl.y+10,fa=a*fade(tau,2.4,.6);
  if(fa>0){
    c.save();c.globalAlpha*=fa;
    c.beginPath();c.moveTo(sl.x+18,sl.y);c.lineTo(sl.x+sl.w,sl.y);c.lineTo(sl.x+sl.w-18,sl.y+20);c.lineTo(sl.x,sl.y+20);c.closePath();c.fillStyle=FOOD_T;c.fill();
    c.beginPath();c.rect(sl.x,sl.y+20,sl.w-18,sl.d);c.fillStyle=FOOD;c.fill();
    c.beginPath();c.moveTo(sl.x+sl.w-18,sl.y+20);c.lineTo(sl.x+sl.w,sl.y);c.lineTo(sl.x+sl.w,sl.y+sl.d);c.lineTo(sl.x+sl.w-18,sl.y+20+sl.d);c.closePath();c.fillStyle=FOOD_D;c.fill();
    const R=rng(31);for(let i=0;i<16;i++)ellipse(c,sl.x+8+R()*(sl.w-34),sl.y+28+R()*(sl.d-14),2+R()*3,1.5+R()*2,rgba(FOOD_D,.7),null);
    c.restore();
    const cyc=mod(Math.max(0,tau-2.6),6)/6,fu=smooth(cyc/.35),gu=smooth((cyc-.38)/.45),end=1-smooth((cyc-.9)/.1);
    const e0=[ro.x+340*s,ro.y+330*s],sx=mix(e0[0],lx,fu),sy=mix(e0[1],ly,fu)-Math.sin(fu*Math.PI)*70;
    c.save();c.globalAlpha*=fa*end;newHyphae(c,lx,ly,gu,t);
    if(fu<1){glow(c,sx,sy,14,C.yellow,.5);circle(c,sx,sy,9,null,rgba(C.yellow,.9),2);}
    sporeDot(c,sx,sy,9.5*s);c.restore();
    tag(c,T.newFood,sl.x-30,sl.y+sl.d+32,{col:C.white,maxW:310,a:fa*fade(tau,3.6,.5)});
  }
  tag(c,T.split,24,170,{col:C.yellow,size:24,maxW:150,a:a*fade(tau,2.0,.5),tgts:[[ro.x+60*s,ro.y+70*s]]});
  tag(c,T.spores,600,236,{col:C.white,size:24,maxW:200,a:a*fade(tau,2.8,.5),tgts:[[636,170]]});
  const na=a*fade(tau,.4,.5);if(na>0){c.save();c.globalAlpha*=na;text(c,T.sketch,20,44,22,C.muted,'left');c.restore();}
}

// ── step 4: mould on an orange ─────────────────────────────────────────────
function step4(c,a,tau,t){
  const L=L4,r=rectOf(L,ORANGE),br=Math.sin(t*.8)*.003;
  drawIn(c,ORANGE,{x:r.x-r.w*br/2,y:r.y-r.h*br/2,w:r.w*(1+br),h:r.h*(1+br)},{alpha:a*fade(tau,0,.8)});
  // a soft light sweeps over the spot
  const ga=a*fade(tau,.8,.6);
  if(ga>0){const [cx,cy]=at(L,ORA_C);c.save();c.globalAlpha*=ga;c.beginPath();c.arc(cx,cy,131*L.sc,0,TAU);c.clip();
    const sx=cx-90+mod(t*.25)*180,g=c.createLinearGradient(sx-30,0,sx+30,0);g.addColorStop(0,rgba(C.white,0));g.addColorStop(.5,rgba(C.white,.16));g.addColorStop(1,rgba(C.white,0));
    c.fillStyle=g;c.fillRect(cx-140,cy-140,280,280);c.restore();}
  tag(c,T.teal,40,120,{col:'#7fd6cf',size:24,maxW:260,a:a*fade(tau,1.0,.5),tgts:[at(L,ORA_C)]});
  tag(c,T.white,40,212,{col:C.white,size:22,maxW:260,a:a*fade(tau,1.6,.5),tgts:[at(L,ORA_W)]});
  tag(c,T.peel,40,304,{col:C.orange,size:22,maxW:260,a:a*fade(tau,2.2,.5),tgts:[at(L,ORA_P)]});
  // warning and the food-strain note, stacked from the bottom
  c.save();const nr=rowsOf(c,T.strain,660,22),nh=nr.length*28;c.restore();
  const wr=rowsOf(c,T.warn4,626,22),wy=578-nh-8-wr.length*28;
  warning(c,T.warn4,20,wy,660,a*fade(tau,2.8,.5));
  const sa=a*fade(tau,3.6,.5);
  if(sa>0){c.save();c.globalAlpha*=sa;nr.forEach((row,i)=>text(c,row,20,578-nh+21+i*28,22,C.muted,'left'));c.restore();}
  aiNote(c,a*fade(tau,.4,.5));
}

// ── step 5: Penicillium enlarged ───────────────────────────────────────────
function step5(c,a,tau,t){
  const gu=ease((tau-.2)/1.1),L=lerpL(L4,L5,gu),r=rectOf(L,ORANGE);
  drawIn(c,ORANGE,r,{alpha:a});
  const src=at(L,ORA_C),sr=131*L.sc;
  ring(c,src[0],src[1],sr,a*fade(tau,1.0,.4),t);
  tag(c,T.spotFrom,24,368,{col:C.yellow,size:22,maxW:206,a:a*fade(tau,1.3,.5)});
  const pu=ease((tau-1.4)/1.2);
  if(pu>0){
    const P5=PAN5,cx=P5.x+P5.w/2,cy=P5.y+P5.h/2,k=mix(2*sr/P5.h,1,pu),x=mix(src[0],cx,pu),y=mix(src[1],cy,pu),pa=a*clamp(pu*3);
    connectors(c,src[0],src[1],sr,[[x-P5.w/2*k,y+P5.h*.12*k],[x-P5.w/2*k,y+P5.h/2*k]],pa,t);
    c.save();c.globalAlpha*=pa;c.translate(x,y);c.scale(k,k);c.translate(-cx,-cy);
    D.round(c,P5.x,P5.y,P5.w,P5.h,18,C.panel,null);
    drawIn(c,BRUSH,rectOf(L5P,BRUSH));
    // the spores light up from the base of each chain to its tip (a wave by distance from the branch base)
    const wa=fade(tau,2.8,.6);
    if(wa>0){const front=mix(D0-40,D1+60,mod((tau-2.8)/3.2));c.save();c.globalAlpha*=wa;c.globalCompositeOperation='lighter';
      BEADS.forEach((b,i)=>{const d=BEAD_D[i],w=Math.exp(-Math.pow((d-front)/34,2));if(w<.04)return;
        const [bx,by]=at(L5P,b);glow(c,bx,by,13,'#bff7f2',.85*w);});
      c.restore();}
    D.round(c,P5.x,P5.y,P5.w,P5.h,18,null,rgba(C.yellow,.9));
    c.restore();
  }
  const la=j=>a*fade(tau,2.6+j*.45,.5);
  const sp=at(L5P,BR_SPORE);
  if(la(0)>0){c.save();c.globalAlpha*=la(0);circle(c,sp[0],sp[1],11+Math.sin(t*3),null,C.yellow,2.5);c.restore();}
  tag(c,T.spore,672,40,{col:C.yellow,size:24,maxW:260,a:la(0),dot:false,tgts:[[sp[0]+11,sp[1]]]});
  tag(c,T.chain,672,140,{col:'#7fd6cf',size:24,maxW:260,a:la(1),tgts:[at(L5P,BR_CHAIN)]});
  tag(c,T.branches,24,214,{col:C.white,size:22,maxW:200,a:la(2),tgts:[at(L5P,BR_BRANCH)]});
  tag(c,T.stalk,672,386,{col:C.white,size:22,maxW:260,a:la(3),tgts:[at(L5P,BR_STALK)]});
  tag(c,T.hyphae,672,486,{col:C.white,size:22,maxW:260,a:la(4),tgts:[at(L5P,BR_HY)]});
  aiNote(c,a*fade(tau,.4,.5));
}

// ── step 6: three kinds of fungi compared ──────────────────────────────────
const X0=20,GAP=12,CW=(920-2*GAP)/3,TOP=20,BOT=528,PIC_Y=30,PIC_H=160;
const colX=j=>X0+j*(CW+GAP);
function outline(c,x,y,w,h,r,color,lw=3){c.save();c.strokeStyle=color;c.lineWidth=lw;c.beginPath();c.roundRect(x,y,w,h,r);c.stroke();c.restore();}
function step6(c,a,tau,t){
  if(a<=.004)return;
  c.save();c.globalAlpha*=a;
  // which column is lit: three slots per stage, the frame slides at the end of each slot
  const q=mod(Math.max(0,tau-.4)/(PER/3),3),j0=Math.floor(q),sl=smooth((q-j0-.82)/.18),j1=(j0+1)%3;
  const fx=j1===0?mix(colX(2),colX(0),sl):mix(colX(j0),colX(j1),sl);
  const lit=j=>j===j0?1-sl:(j===j1?sl:0);
  COLS.forEach((col,j)=>{const x=colX(j),o=lit(j),cx=x+CW/2,ap=fade(tau,j*.25,.5);
    c.save();c.globalAlpha*=ap;
    D.round(c,x,TOP,CW,BOT-TOP,14,'rgba(22,51,43,.9)',null);
    if(o>.01){c.save();c.globalAlpha*=o;D.round(c,x,TOP,CW,BOT-TOP,14,rgba(C.yellow,.07+.03*Math.sin(t*2.6)),null);
      c.save();c.beginPath();c.roundRect(x,TOP,CW,BOT-TOP,14);c.clip();const sy=TOP-80+mod(t*.22)*(BOT-TOP+160),g=c.createLinearGradient(0,sy-70,0,sy+70);
      g.addColorStop(0,rgba(C.white,0));g.addColorStop(.5,rgba(C.white,.08));g.addColorStop(1,rgba(C.white,0));c.fillStyle=g;c.fillRect(x,sy-70,CW,140);c.restore();c.restore();}
    const bob=2.5*Math.sin(t*1.6+j*1.3),r=fitRect(col.pic,x+20,PIC_Y,CW-40,PIC_H);
    if(col.crop){const [W,H]=SZ(col.pic),cw=W*col.crop[2],ch=H*col.crop[3],kk=Math.min((CW-40)/cw,PIC_H/ch),w=cw*kk,h=ch*kk;
      drawIn(c,col.pic,{x:cx-w/2,y:PIC_Y+(PIC_H-h)/2+bob,w,h},{crop:col.crop});}
    else drawIn(c,col.pic,{x:r.x,y:r.y+bob,w:r.w,h:r.h});
    text(c,col.name,cx,PIC_Y+PIC_H+40,26,o>.5?C.yellow:C.white,'center');
    let y=PIC_Y+PIC_H+60;
    line(c,[[x+16,y],[x+CW-16,y]],rgba(C.white,.2),2);y+=10;
    col.lines.forEach((p,i)=>{const rows=rowsOf(c,p,CW-56,22),pop=fade(tau,.6+j*.25+i*.2,.4);
      c.save();c.globalAlpha*=pop;circle(c,x+24,y+16,5,i===0?C.cyan:C.green,null);
      rows.forEach((row,q2)=>text(c,row,x+38,y+24+q2*28,22,C.white,'left'));c.restore();y+=rows.length*28+12;});
    const er=rowsOf(c,col.ex,CW-40,22);c.save();c.globalAlpha*=fade(tau,1.2+j*.25,.4);
    er.forEach((row,q2)=>text(c,row,x+20,BOT-18-(er.length-1-q2)*28,22,C.muted,'left'));c.restore();
    c.restore();});
  const fa=fade(tau,.4,.5);
  if(fa>0){c.save();c.globalAlpha*=fa;outline(c,fx,TOP,CW,BOT-TOP,14,C.yellow,3);
    const qq=mod(t*.8);outline(c,fx-qq*6,TOP-qq*6,CW+qq*12,BOT-TOP+qq*12,14+qq*4,rgba(C.yellow,.6*(1-qq)),2.5);c.restore();}
  const na=fade(tau,1.6,.5);
  if(na>0){c.save();c.globalAlpha*=na;text(c,T.notMush,20,568,24,C.yellow,'left');c.restore();}
  c.restore();
}

const STEPS=[step1,step2,step3,step4,step5,step6];

// ── draw ───────────────────────────────────────────────────────────────────
function draw(c,s,t){
  const {k,tau,held}=stageClock(s,t,N,PER);
  s.shown=k;
  const {from,u}=track(s,'_mL',k,t,.8),out=held?1:1-fade(tau,PER-.45,.45);
  if(from!==k&&u<1)STEPS[from](c,1-u,30,t);
  STEPS[k](c,(from!==k?u:1)*out,tau,t);
  // step markers (tap to jump to a step)
  for(let j=0;j<N;j++){const x=MK_X+j*MK_DX,y=MK_Y;
    if(j===k)marker(c,x,y,j+1,null,14);
    else{circle(c,x,y,14,'rgba(11,26,21,.9)',rgba(C.muted,.8),2);c.save();c.font=MONO(20);c.fillStyle=C.muted;c.textAlign='center';c.textBaseline='middle';c.fillText(String(j+1),x,y+1);c.restore();}
    D.hit(x-MK_DX/2,y-22,MK_DX,44,'phase',j);}
}
window.FungiDraw.molds=draw;
})();
