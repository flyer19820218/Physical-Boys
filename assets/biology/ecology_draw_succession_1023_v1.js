/* Ecology lesson 1 · "succession" canvas (succession tab, view 0), 2026-10-23 (v1, transparent pictures).
 * Five stages (bare ground → pioneers → herbs → shrubs → trees) × two starting points (s.origin 0 soil, 1 bare rock).
 * Layout (one frame shared by every stage; only the picture, the bars and the tags change, with cross-fades):
 *   top     a stage track of five pills (current = yellow, passed = green outline); stage 0/1 names follow the origin.
 *   left    the scene (x 16..468): the teacher's Gemini AI blocks, background removed (transparent PNG), pasted straight
 *           on the board colour (no frame, no crop). All 800-wide blocks use one scale (0.45) and one centre (x 242),
 *           and their block bottom row (PIL: last row whose opaque width > 60 %) sits on one ground line GY, so the block
 *           never jumps during a cross-fade. SU4_forest 1000×495 is drawn 452 wide on the same ground line; the free space
 *           above it holds a name card: EC8_camphor_tree + "Trees, e.g. camphor tree".
 *           origin 0: SU1_soil → SU2_seedling → SU3_herb → SU3_shrub → SU4_forest
 *           origin 1: SU1_rock → SU2_lichen  → SU3_herb → SU3_shrub → SU4_forest
 *           Every visible thing has a name tag with a leader; anchors were measured on the PNGs (picture pixels).
 *           Not in the pictures, so drawn here and named: seeds in the soil (origin 0, stage 0), herb seedlings on the soil
 *           (origin 0, stage 1; the cut-out removed them) and moss tufts on the rock top (origin 1, stage 1; also removed).
 *           "Rock" is tagged only where rock shows: SU1_soil, SU1_rock, SU2_seedling, SU2_lichen, SU4_forest.
 *   right   "Community makeup": one schematic bar per group (no numbers); origin 0 rows herbs / shrubs / trees,
 *           origin 1 adds lichen and moss. Under it three schematic meters: soil depth, water held, light at ground.
 *           Then "Early arrivals change conditions": cause pill → effect pill for this stage; the meter that changes glows.
 *           Stage 4 adds "The path is not fixed".
 *   bottom  "AI illustration, not a photo · Schematic" under the scene; "Succession: community makeup changes"
 *           (stage 4: "Not one herb growing into a tree").
 * No years, no numbers on any bar. s.shown = stage every frame. Held stages keep moving (slow breathing, pulses, sway,
 * flowing leaders). Switching s.origin drops any cross-fade, so the two starting points never mix on screen.
 */
(()=>{'use strict';
const K=window.EcologyKit,{P,C,D,TAU,clamp,mix,mod,smooth,rgba,text,measure,glow,circle,ellipse,dim,stageClock}=K;
const L=(k,zh,en)=>(K.LAB&&K.LAB[k])||P(zh,en);
const N=5,PER=7,CW=960,MOVE=1.2;
const YELLOW=C.yellow,WHITE=C.white,ORANGE=C.orange,GREEN=C.green,CYAN=C.cyan,GREY='#9fb3a8',BROWN='#c08a52',SEED='#f1d27a';

// ── geometry ───────────────────────────────────────────────────────────────
const PX=16,PY=72,PW=452,PH=462;                       // scene area
const RX=486,RW=CW-16-RX;                               // right column
const SCX=PX+PW/2,GY=526,S800=.45,FOREST='SU4_forest.png',S4=PW/1000;
// block bottom row of each picture (PIL: last row whose opaque width > 60 % of the picture)
const BOT={'SU1_rock.png':814,'SU1_soil.png':809,'SU2_lichen.png':807,'SU2_seedling.png':804,'SU3_herb.png':817,'SU3_shrub.png':986,'SU4_forest.png':475};
function rectOf(f){const [W,H]=dim(f),sc=f===FOREST?S4:S800;return{x:SCX-W*sc/2,y:GY-BOT[f]*sc,w:W*sc,h:H*sc,s:sc};}
// picture pixel → canvas
function mapPt(f,ix,iy){const r=rectOf(f);return[r.x+ix*r.s,r.y+iy*r.s];}

// pictures per origin and stage
const FILES=[['SU1_soil.png','SU2_seedling.png','SU3_herb.png','SU3_shrub.png',FOREST],
             ['SU1_rock.png','SU2_lichen.png','SU3_herb.png','SU3_shrub.png',FOREST]];
// name tags on each picture: [label key, anchor in picture px, tag x, tag y, align]
const TAGS={
 'SU1_soil.png':[['seeds',[390,100],24,98,'left'],['roots',[262,205],136,98,'left'],['soil',[650,150],460,98,'right'],['rock',[300,600],24,470,'left']],
 'SU1_rock.png':[['noSoil',[360,12],242,96,'center'],['rockShort',[330,560],24,470,'left']],
 'SU2_seedling.png':[['seedlings',[110,30],24,98,'left'],['soil',[650,150],460,98,'right'],['rock',[300,600],24,470,'left']],
 'SU2_lichen.png':[['moss',[190,18],24,98,'left'],['lichen',[686,320],460,98,'right'],['rock',[300,600],24,470,'left']],
 'SU3_herb.png':[['herbs',[250,200],24,98,'left'],['litter',[243,443],24,318,'left'],['soil',[300,620],24,440,'left']],
 'SU3_shrub.png':[['shrubs',[186,257],24,78,'left'],['herbs',[686,429],460,300,'right'],['litter',[286,514],24,300,'left'],['roots',[400,686],460,400,'right'],['soil',[129,857],24,470,'left']],
 'SU4_forest.png':[['trees',[500,80],242,262,'center'],['herbs',[150,285],24,262,'left'],['soil',[600,360],460,262,'right'],['rock',[450,450],20,486,'left']]};
// drawn by program (picture px): seeds in the SU1_soil soil band, seedlings on the SU2_seedling soil top, moss on the SU2_lichen rock top
const SEEDS=[[120,140,.4],[250,230,1.1],[390,100,0],[470,250,2],[600,180,.7],[700,110,1.6],[330,170,2.4],[160,262,.2]];
const SPROUTS=[[110,44],[210,44],[300,46],[385,46],[470,42],[620,42],[705,44]];
const MOSS=[[190,26],[290,18],[530,36],[640,38]];

// community makeup (schematic 0..1 per row; no numbers are shown)
const ROWS=[[['herbs',GREEN],['shrubs','#a3e635'],['trees','#34d399']],
            [['lichen',ORANGE],['moss','#bef264'],['herbs',GREEN],['shrubs','#a3e635'],['trees','#34d399']]];
const AB=[[[0,0,0],[.4,0,0],[.9,0,0],[.55,.75,0],[.25,.35,.85]],
          [[0,0,0,0,0],[.75,.5,0,0,0],[.35,.45,.8,0,0],[.15,.3,.5,.75,0],[.1,.3,.25,.35,.85]]];
// environment meters (schematic): soil depth, water held, light at ground
const ENV=[{soil:[.35,.38,.62,.8,.9],water:[.3,.35,.6,.75,.85]},{soil:[0,.12,.45,.7,.86],water:[.05,.15,.5,.7,.82]}];
const LIGHT=[1,1,.88,.6,.25];
// cause → effect per stage; meter index that glows (0 soil, 1 water, 2 light)
const CAUSE=o=>[o?[['noSoil'],null,-1]:[['soilHolds'],null,-1],
  o?[['lichenMoss'],['thinSoil'],0]:[['seedsRoots'],['seedlings'],-1],
  [['rootsLitter'],['thickSoil'],0],[['shrubs'],['shade'],2],[['canopy'],['lessLight'],2]];

// ── helpers ────────────────────────────────────────────────────────────────
const withA=(c,a,fn)=>{if(a<=0.002)return;c.save();c.globalAlpha*=Math.min(1,a);fn();c.restore();};
function tag(c,p,x,y,{al='left',col=WHITE,active=false,size=22,fill='rgba(11,26,21,.9)'}={}){
  const w=measure(c,p,size)+28,h=size+18,bx=Math.max(8,Math.min(CW-8-w,al==='right'?x-w:al==='center'?x-w/2:x));
  D.round(c,bx,y,w,h,h/2,active?col:fill,active?WHITE:rgba(col,.9));
  text(c,p,bx+w/2,y+h/2+size*.36,size,active?C.deep:col,'center');
  return{x:bx,y,w,h};
}
function ring(c,r,t,col){const u=mod(t*.8);D.round(c,r.x-8*u,r.y-8*u,r.w+16*u,r.h+16*u,r.h/2+8*u,null,rgba(col,.9*(1-u)));}
// leader from the edge of a tag to a point, with a pulsing dot
function leader(c,r,ax,ay,t,col){
  const cx=r.x+r.w/2,cy=r.y+r.h/2,ex=clamp((ax-r.x)/r.w)*r.w+r.x,ey=ay>cy?r.y+r.h:(ay<r.y?r.y:cy);
  const sx=Math.abs(ay-cy)<r.h/2?(ax>cx?r.x+r.w:r.x):ex;
  c.save();c.setLineDash([6,5]);c.lineDashOffset=-t*18;K.line(c,[[sx,ey],[ax,ay]],rgba(C.deep,.85),5);K.line(c,[[sx,ey],[ax,ay]],rgba(col,.95),2.5);c.restore();
  circle(c,ax,ay,6,col,C.deep,2);const u=mod(t*.7);circle(c,ax,ay,6+u*10,null,rgba(col,.8*(1-u)),2);
}
function scene(c,f,a,t){if(a<=0.002)return;const r=rectOf(f),z=1+.004*(1+Math.sin(t*.45)),bx=SCX,by=GY;
  c.save();c.globalAlpha*=a;
  ellipse(c,SCX,GY+6,r.w*.46,10,rgba(C.deep,.55),null);               // ground shadow under the block
  c.translate(bx,by);c.scale(z,z);c.translate(-bx,-by);K.drawIn(c,f,r);c.restore();}
function seeds(c,f,a,t){withA(c,a,()=>SEEDS.forEach(([ix,iy,ph])=>{const [x,y]=mapPt(f,ix,iy),g=.5+.5*Math.sin(t*2.2+ph);
  glow(c,x,y,12,SEED,.25+.25*g);ellipse(c,x,y,5.5,3.8,SEED,C.deep,1.5,ph);}));}
function sprouts(c,f,a,t){withA(c,a,()=>SPROUTS.forEach(([ix,iy],i)=>{const [x,y]=mapPt(f,ix,iy),h=16+(i%3)*4,sw=Math.sin(t*1.6+i)*2.5,tx=x+sw,ty=y-h;
  K.sline(c,[[x,y],[x+sw*.4,y-h*.5],[tx,ty]],'#2f7a3a',4);K.sline(c,[[x,y],[x+sw*.4,y-h*.5],[tx,ty]],'#86d46a',2.4);
  ellipse(c,tx-6,ty+1,7,3.4,'#7cc95b',C.deep,1.2,-.5);ellipse(c,tx+6,ty+1,7,3.4,'#9be07a',C.deep,1.2,.5);}));}
function moss(c,f,a,t){withA(c,a,()=>MOSS.forEach(([ix,iy],i)=>{const [x,y]=mapPt(f,ix,iy),b=.5+.5*Math.sin(t*1.8+i);
  const r=K.rng(90+i);for(let q=0;q<9;q++){const dx=(r()-.5)*30,dy=(r()-.5)*6-2,rr=4+r()*3;circle(c,x+dx,y+dy,rr+b*.6,q%2?'#6fa83a':'#9ccc4f',rgba(C.deep,.6),1);}}));}
function tags(c,f,a,t){withA(c,a,()=>(TAGS[f]||[]).forEach(([key,[ix,iy],x,y,al])=>{
  const [ax,ay]=mapPt(f,ix,iy),col=key==='seeds'?SEED:key==='rock'||key==='rockShort'||key==='noSoil'?WHITE:key==='soil'?BROWN:key==='lichen'?ORANGE:GREEN;
  const p=L(key,key,key),w=measure(c,p,22)+28,bx=al==='right'?x-w:al==='center'?x-w/2:x;
  leader(c,{x:bx,y,w,h:40},ax,ay,t,col);tag(c,p,x,y,{al,col});}));}
function camphorCard(c,a,t){withA(c,a,()=>{const y=PY+14,h=104,x=PX+8,w=PW-16;
  D.round(c,x,y,w,h,12,'rgba(11,26,21,.85)',rgba('#34d399',.7));
  const ih=h-14,iw=ih*dim('EC8_camphor_tree.png')[0]/dim('EC8_camphor_tree.png')[1],sw=Math.sin(t*1.1)*.02;
  c.save();c.translate(x+20+iw/2,y+7+ih);c.rotate(sw);K.drawIn(c,'EC8_camphor_tree.png',{x:-iw/2,y:-ih,w:iw,h:ih});c.restore();
  const p=L('treeExample','林木，例如樟樹','Trees, e.g. camphor tree'),tw=w-iw-56,two=measure(c,p,22)>tw;
  K.wrap(c,p,x+iw+36,y+h/2+8-(two?15:0),tw,22,'#34d399',30);});}

// stage track
function track(c,o,k,t){
  const names=[o?L('rockShort','裸岩','Bare rock'):L('groundShort','有土的裸地','Ground with soil'),o?L('lichenMoss','地衣、苔蘚','Lichen and moss'):L('seedlings','草本幼苗','Herb seedlings'),
    L('herbs','草本','Herbs'),L('shrubs','灌木','Shrubs'),L('trees','林木','Trees')];
  const ws=names.map(p=>measure(c,p,22)+28),gap=34,tot=ws.reduce((a,b)=>a+b,0)+gap*4;let x=(CW-tot)/2;
  names.forEach((p,i)=>{const col=i===k?YELLOW:i<k?GREEN:GREY,r=tag(c,p,x,14,{col,active:i===k});if(i===k)ring(c,r,t,YELLOW);
    x+=ws[i];if(i<4){const bob=i===k?Math.sin(t*3)*3:0;K.arrow(c,x+6+bob,34,x+gap-6+bob,34,i<k?GREEN:rgba(GREY,.8),3);}x+=i<4?gap:0;});
}
// a schematic bar (no numbers)
function bar(c,x,y,w,h,v,col,t,ph=0){D.round(c,x,y,w,h,h/2,'#0f2a22',rgba(GREY,.5));
  if(v>.005){const fw=Math.max(h,w*v),rip=.5+.5*Math.sin(t*2+ph);D.round(c,x,y,fw,h,h/2,rgba(col,.75+.2*rip),null);
    circle(c,x+fw-h/2,y+h/2,h/2-3+rip*2,rgba(WHITE,.35),null);}}
function sunIcon(c,x,y,t,lv){glow(c,x,y,18,YELLOW,.25+.2*lv);for(let i=0;i<8;i++){const an=i*TAU/8+t*.4;K.sline(c,[[x+Math.cos(an)*10,y+Math.sin(an)*10],[x+Math.cos(an)*14,y+Math.sin(an)*14]],YELLOW,2.5);}circle(c,x,y,7,YELLOW,null);}
function dropIcon(c,x,y,t){const b=Math.sin(t*2.5)*1.5;c.save();c.beginPath();c.moveTo(x,y-11+b);c.quadraticCurveTo(x+9,y+1+b,x,y+8+b);c.quadraticCurveTo(x-9,y+1+b,x,y-11+b);c.fillStyle=CYAN;c.fill();c.restore();}
function soilIcon(c,x,y,lv){D.round(c,x-10,y-9,20,18,3,'#8c8577',null);const sh=Math.max(1,16*lv);c.fillStyle=BROWN;c.fillRect(x-10,y-9,20,Math.min(18,sh));K.line(c,[[x-11,y-9],[x+11,y-9]],GREEN,2);}

// ── frame ──────────────────────────────────────────────────────────────────
function draw(c,s,t){
  const {k}=stageClock(s,t,N,PER);
  s.shown=k;
  const o=s.origin===1?1:0;
  const st=s.su||(s.su={});
  if(st.k===undefined||st.o!==o){st.k=k;st.o=o;st.from=-1;st.T=t-9;}
  if(st.k!==k){st.from=st.k;st.k=k;st.T=t;}
  if(t<st.T)st.T=t;
  const x=clamp((t-st.T)/MOVE),moving=st.from>=0&&x<1,u=moving?smooth(x):1;
  const wOf=j=>moving?(j===st.from?1-u:0)+(j===k?u:0):(j===k?1:0);
  // text layers swap in sequence (old out in the first half, new in during the second), so words never overprint
  const wSeq=j=>moving?(j===st.from?1-smooth(clamp(x*2)):j===k?smooth(clamp(x*2-1)):0):(j===k?1:0);
  const blend=fn=>moving?mix(fn(st.from),fn(k),u):fn(k);
  const files=FILES[o];

  // ── track
  track(c,o,k,t);

  // ── scene panel
  const fIn=files[k],fOut=moving?files[st.from]:null;
  if(fOut&&fOut!==fIn){const aIn=smooth(clamp(x*2)),aOut=1-smooth(clamp(x*2-1));scene(c,fOut,aOut,t);scene(c,fIn,aIn,t);}
  else scene(c,fIn,1,t);
  // seeds drawn into the soil picture (origin 0, stage 0)
  if(o===0){seeds(c,files[0],wSeq(0),t);sprouts(c,files[1],wOf(1),t);}else moss(c,files[1],wOf(1),t);
  // camphor name card above the forest picture
  camphorCard(c,wSeq(4),t);
  // name tags: per stage (the same picture may serve two stages only across origins, so stage weight is enough)
  for(let j=0;j<N;j++)tags(c,files[j],wSeq(j),t);

  // ── right column: community makeup
  const rows=ROWS[o],rh=o?31:46,cy0=PY+2,CH=200;
  D.round(c,RX,PY,RW,CH,14,'#16332b',C.edge);
  text(c,L('composition','群集組成','Community makeup'),RX+16,cy0+28,22,WHITE);
  const by=cy0+(o?38:46);
  const labW=Math.max(...rows.map(([key])=>measure(c,L(key,key,key),22)))+26;
  rows.forEach(([key,col],i)=>{const y=by+i*rh,v=blend(j=>AB[o][j][i]),isNew=AB[o][k][i]>0&&(k===0||AB[o][k-1][i]===0);
    text(c,L(key,key,key),RX+16,y+22,22,v>.02?col:GREY);
    bar(c,RX+16+labW,y+6,RW-32-labW,18,v,col,t,i);
    if(isNew&&!moving){const bx=RX+16+labW+(RW-32-labW)*v;K.pulse(c,bx-6,y+15,t,col,9);}});

  // ── environment meters
  const ey=PY+CH+8,eh=118;
  D.round(c,RX,ey,RW,eh,14,'#16332b',C.edge);
  const cz=CAUSE(o),lit=cz[k][2],litPrev=moving?cz[st.from][2]:lit;
  const meters=[[L('soilDepth','土壤厚度','Soil depth'),BROWN,blend(j=>ENV[o].soil[j]),(xx,yy)=>soilIcon(c,xx,yy,blend(j=>ENV[o].soil[j]))],
    [L('waterHeld','保水','Water held'),CYAN,blend(j=>ENV[o].water[j]),(xx,yy)=>dropIcon(c,xx,yy,t)],
    [L('groundLight','地面的光','Light at ground'),YELLOW,blend(j=>LIGHT[j]),(xx,yy)=>sunIcon(c,xx,yy,t,blend(j=>LIGHT[j]))]];
  const mw=Math.max(...meters.map(m=>measure(c,m[0],22)))+58;
  meters.forEach(([p,col,v,icon],i)=>{const y=ey+10+i*36;
    const g=(lit===i?u:0)+(moving&&litPrev===i?1-u:0);
    if(g>0)withA(c,g,()=>{D.round(c,RX+6,y-2,RW-12,36,10,rgba(col,.12+.06*Math.sin(t*3)),rgba(col,.8));});
    icon(RX+26,y+16);text(c,p,RX+44,y+24,22,col);
    bar(c,RX+mw,y+8,RW-mw-16,18,v,col,t,i+3);});

  // ── early arrivals change conditions
  const cyb=ey+eh+8,ch=PY+PH-cyb;
  D.round(c,RX,cyb,RW,ch,14,'#16332b',C.edge);
  for(let j=0;j<N;j++){const w=wSeq(j);if(w<=0)continue;withA(c,w,()=>{
    const [cause,effect]=cz[j];
    const head=j===0?L('origin','起點','Starting point'):L('firstChange','先到的生物改變環境','Early arrivals change conditions');
    text(c,head,RX+16,cyb+28,22,j===0?CYAN:WHITE);
    let xx=RX+16;const yy=cyb+38;
    const a=tag(c,L(cause[0],'',''),xx,yy,{col:j===0?CYAN:GREEN,active:true});xx=a.x+a.w+8;
    if(effect){const bob=Math.sin(t*3)*3,ep=L(effect[0],'',''),ew=measure(c,ep,22)+28;
      const ecol=cz[j][2]===2?YELLOW:j===1&&o===0?GREEN:BROWN;let e;
      if(xx+46+ew<=RX+RW-12){K.arrow(c,xx+4+bob,yy+20,xx+32+bob,yy+20,WHITE,3.5);e=tag(c,ep,xx+40,yy,{col:ecol,active:true});}
      else{// too wide for one row (English): the effect drops to the second row, the arrow bends down to it
        const ax=a.x+28;K.line(c,[[ax,yy+42],[ax,yy+66]],WHITE,3.5);K.arrow(c,ax,yy+66,ax+30+bob,yy+66,WHITE,3.5);e=tag(c,ep,ax+38,yy+46,{col:ecol,active:true});}
      ring(c,e,t,ecol);}
    if(j===4){const r=tag(c,L('notFixedPath','路徑不固定','The path is not fixed'),RX+16,yy+46,{col:ORANGE});
      // a small fork icon after the pill: one path splits into three
      const fx=r.x+r.w+16,fy=r.y+r.h/2;K.line(c,[[fx,fy],[fx+20,fy]],ORANGE,3);
      [-14,0,14].forEach((d,q)=>{c.save();c.setLineDash([5,4]);c.lineDashOffset=-t*16;K.line(c,[[fx+20,fy],[fx+48,fy+d]],ORANGE,3);c.restore();
        circle(c,fx+50,fy+d,4,q===1?ORANGE:null,ORANGE,2);});}
  });}

  // ── bottom row
  {const ai=L('aiNote','AI 插圖，非實拍','AI illustration, not a photo'),sc=L('schematic','示意','Schematic'),y=PY+PH+12;
    const w1=measure(c,ai,22),w2=measure(c,sc,22),w=w1+w2+46;
    D.round(c,PX,y,w,36,10,'rgba(11,26,21,.8)',rgba(GREY,.6));text(c,ai,PX+10,y+26,22,C.muted);
    circle(c,PX+w1+23,y+18,3.5,GREY,null);text(c,sc,PX+w1+36,y+26,22,GREY);}
  {const y=PY+PH+10,a4=moving&&(st.from===4)!==(k===4)?(k===4?smooth(clamp(x*2-1)):1-smooth(clamp(x*2))):(k===4?1:0),a03=moving&&(st.from===4)!==(k===4)?(k===4?1-smooth(clamp(x*2)):smooth(clamp(x*2-1))):(k===4?0:1);
    withA(c,a03,()=>{const r=tag(c,L('compositionChange','演替：群集的組成改變','Succession: the community makeup changes'),RX+RW,y,{al:'right',col:CYAN});glow(c,r.x+r.w/2,r.y+r.h/2,r.w*.5,CYAN,.08+.04*Math.sin(t*2));});
    withA(c,a4,()=>{const r=tag(c,L('notOneTree','不是一株草長成樹','Not one herb growing into a tree'),RX+RW,y,{al:'right',col:YELLOW,active:true});ring(c,r,t,YELLOW);});}
}
window.EcologyDraw.succession=draw;
})();
