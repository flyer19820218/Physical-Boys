/* Ecology lesson 4 · "adapt" canvas (land-habitats tab, view 1), 2026-10-24. One kind of problem, different solutions.
 * A camera view (left, 652x470) looks at a whole landscape and then pushes in on one organism; a small card on the right reads
 * "Problem -> Solution" (problem text, arrow, solution = the organism, shown in a small thumbnail with its name).
 * Pictures (K.SIZE): HB2_desert / HB3_tundra 1672x933 full scenes; HB12_camel 1166x1124 and HB13_reindeer 1056x1183 cut-outs,
 * pasted into the scenes in scene pixels; SU2_lichen 800x852 as a round magnifier inset. All points below were measured with PIL
 * on the original pictures, in picture pixels:
 *   HB2: cactus trunk x 215-415, right arm to x 600 (y 0-210); a spine cluster on the arm's lower edge (527,146); trunk (360,400);
 *        the small far camel at x 1015-1120, y 350-430 is painted over once on load with plain sand from 240 px to its left (feathered ellipse).
 *   HB3: low shrub (dark green leaves) centre (840,720); pale coral lichen clump (545,800);
 *        the small far reindeer (x 1095-1205, y 262-328) and its reflection (y 340-378) are painted over with grass/pond from 250 px left (feathered ellipse).
 *   HB12 (faces left): hump centre (780,120), feet y 1110.  HB13 (faces left): neck mane (250,650), hooves y 1150;
 *        pure-white specks in the antler gaps / between the legs (4 small boxes, see REIN_FIX) are made transparent on load.
 *   SU2_lichen: lichen crusts in the upper left, inset crop x 80-340, y 120-380.
 * Four steps, 9 s each; s.shown = step. Each step's camera follows keyframes; the next step starts where the previous one ended
 * (step 0 ends on the cactus, step 1 starts there; step 2 ends on the shrubs, step 3 starts there); a 0.45 s cross-fade covers jumps.
 *  0 desert, problem "Water shortage": whole desert -> push to the cactus; "Stem: stores water", "Spines: cut water loss".
 *  1 camel: pull back and pan right, the camel cut-out walks in, push to it; big yellow "Hump: stores fat, not water" with pointer.
 *  2 tundra, problem "Cold, short growing season": whole tundra -> push to low shrubs and lichen; lichen magnifier; "Low, close to the ground".
 *  3 reindeer: pull back, reindeer walks in, push to it; "Thick fur"; then the view shrinks into the 4th of four thumbnails,
 *    grouped by problem (water / cold), and "The same kind of problem, different solutions".
 * Labels from K.LAB; new labels are the P() constants below.
 */
(()=>{'use strict';
const K=window.EcologyKit,{P,C,D,clamp,mix,mod,smooth,ease,rgba,text,measure,circle}=K;
const L=(k,zh,en)=>(K.LAB&&K.LAB[k])||P(zh,en);
// new labels (not in K.LAB)
const SAME_DIFF=P('同一類難題，不同的解法','The same kind of problem, different solutions');
const N=4,PER=9,CW=960,OUT=.45;
const WHITE=C.white,YELLOW=C.yellow,GREEN=C.green,ORANGE=C.orange,CYAN=C.cyan,MUTED=C.muted,SAND=C.sand;
const FILL='rgba(11,26,21,.92)',PANEL='#16332b',CARD_BG='#1c3d34';

// ── helpers (same look as the climate / settle / oxygen views) ─────────────
const withA=(c,a,fn)=>{if(a<=0.002)return;c.save();c.globalAlpha*=Math.min(1,a);fn();c.restore();};
function tag(c,p,x,y,{al='left',col=WHITE,active=false,size=22,minX=8,maxX=CW-8}={}){
  const w=measure(c,p,size)+28,h=size+18,bx=Math.max(minX,Math.min(maxX-w,al==='right'?x-w:al==='center'?x-w/2:x));
  D.round(c,bx,y,w,h,h/2,active?col:FILL,active?WHITE:rgba(col,.9));
  text(c,p,bx+w/2,y+h/2+size*.36,size,active?C.deep:col,'center');
  return{x:bx,y,w,h};
}
// rows for a label: one row if it fits, else break after a colon or comma first, then by width
function rowsOf(c,str,maxW,size){
  const w=r=>measure(c,[r,r],size);if(w(str)<=maxW)return[str];
  const m=str.match(/^(.+?[：，:,])\s*(.+)$/);
  if(m&&w(m[1])<=maxW)return[m[1],...rowsOf(c,m[2],maxW,size)];
  return K.splitLines(c,str,maxW,size);}
function rowsText(c,p,x,y,maxW,size,col,lh){const rows=rowsOf(c,D.tr(p),maxW,size);rows.forEach((r,i)=>text(c,[r,r],x,y+i*lh,size,col,'center'));return rows.length*lh;}
// label box that wraps onto several rows when the text is wider than maxW
function box(c,p,x,y,{al='left',col=WHITE,active=false,size=22,maxW=220,minX=8,maxX=CW-8}={}){
  const rows=rowsOf(c,D.tr(p),maxW-28,size),lh=size+8,w=Math.max(...rows.map(r=>measure(c,[r,r],size)))+28,h=rows.length*lh+14;
  const bx=Math.max(minX,Math.min(maxX-w,al==='right'?x-w:al==='center'?x-w/2:x));
  D.round(c,bx,y,w,h,Math.min(h/2,20),active?col:FILL,active?WHITE:rgba(col,.9));
  rows.forEach((r,i)=>text(c,[r,r],bx+w/2,y+7+i*lh+size*.86,size,active?C.deep:col,'center'));
  return{x:bx,y,w,h};
}
function pulseRing(c,p,t,col=YELLOW){const u=mod(t*.7),r=Math.min(p.h/2,20);D.round(c,p.x-6*u,p.y-6*u,p.w+12*u,p.h+12*u,r+6*u,null,rgba(col,.8*(1-u)));}
// hand-drawn pointer: a slightly bent chalk line ending in a small open circle on the target
function pointer(c,a,b,col,t){const mx=(a[0]+b[0])/2+(b[1]-a[1])*.18,my=(a[1]+b[1])/2-(b[0]-a[0])*.18;
  c.save();c.lineCap='round';c.beginPath();c.moveTo(...a);c.quadraticCurveTo(mx,my,b[0],b[1]);
  c.strokeStyle='rgba(11,26,21,.75)';c.lineWidth=6;c.stroke();c.strokeStyle=col;c.lineWidth=3;c.setLineDash([9,5]);c.lineDashOffset=-t*10;c.stroke();c.restore();
  circle(c,b[0],b[1],8,null,'rgba(11,26,21,.75)',5);circle(c,b[0],b[1],8,null,col,2.5);
  const u=mod(t*.8);circle(c,b[0],b[1],9+u*12,null,rgba(col,.8*(1-u)),2);}

// ── pictures: scenes cleaned once (far animals painted over), cut-outs cleaned once ──
const IW=1672,IH=933;
const SCENES={
  desert:{file:'HB2_desert.jpg',patch:{cx:1067,cy:392,rx:105,ry:72,dx:-240}},
  tundra:{file:'HB3_tundra.jpg',patch:{cx:1140,cy:312,rx:104,ry:88,dx:-250}}};
const CAMEL={file:'HB12_camel.png',x:1060,y:403,sc:.34,hump:[780,120],feet:1110};
const REIN={file:'HB13_reindeer.png',x:1180,y:295,sc:.30,fur:[250,650],feet:1150};
const REIN_FIX=[[242,331,285,365],[333,303,349,318],[444,979,467,1001],[452,904,460,955]];
const CACHE={},PRELOAD=['HB2_desert.jpg','HB3_tundra.jpg','HB12_camel.png','HB13_reindeer.png','SU2_lichen.png'];
function cleanScene(key){
  if(CACHE[key])return CACHE[key];const sc=SCENES[key],im=K.pic(K.src(sc.file));if(!im)return null;
  const cv=document.createElement('canvas');cv.width=IW;cv.height=IH;const g=cv.getContext('2d');g.drawImage(im,0,0,IW,IH);
  const p=sc.patch,pw=p.rx*2,ph=p.ry*2,pc=document.createElement('canvas');pc.width=pw;pc.height=ph;const q=pc.getContext('2d');
  q.drawImage(im,p.cx-p.rx+p.dx,p.cy-p.ry,pw,ph,0,0,pw,ph);
  // feathered elliptical mask
  q.globalCompositeOperation='destination-in';q.save();q.translate(p.rx,p.ry);q.scale(1,p.ry/p.rx);
  const gr=q.createRadialGradient(0,0,p.rx*.72,0,0,p.rx);gr.addColorStop(0,'rgba(0,0,0,1)');gr.addColorStop(1,'rgba(0,0,0,0)');
  q.fillStyle=gr;q.beginPath();q.arc(0,0,p.rx,0,Math.PI*2);q.fill();q.restore();
  g.drawImage(pc,p.cx-p.rx,p.cy-p.ry);
  return CACHE[key]=cv;}
function cleanCut(a){
  if(CACHE[a.file])return CACHE[a.file];const im=K.pic(K.src(a.file));if(!im)return null;
  if(a!==REIN)return CACHE[a.file]=im;
  const W=im.naturalWidth,H=im.naturalHeight,cv=document.createElement('canvas');cv.width=W;cv.height=H;const g=cv.getContext('2d');g.drawImage(im,0,0);
  try{for(const [x0,y0,x1,y1] of REIN_FIX){const d=g.getImageData(x0,y0,x1-x0,y1-y0),v=d.data;
      for(let i=0;i<v.length;i+=4)if(v[i]>222&&v[i+1]>222&&v[i+2]>222)v[i+3]=0;g.putImageData(d,x0,y0);}}catch(e){return CACHE[a.file]=im;}
  return CACHE[a.file]=cv;}
const cutRect=a=>{const [W,H]=K.dim(a.file);return{x:a.x,y:a.y,w:W*a.sc,h:H*a.sc};};
const cutPt=(a,[px,py])=>[a.x+px*a.sc,a.y+py*a.sc];

// camera: cam = [cx, cy, cw] in scene pixels; the height follows the aspect of the target rect
function frame(cam,R){let [cx,cy,cw]=cam,ch=cw*R.h/R.w;if(ch>IH){cw*=IH/ch;ch=IH;}if(cw>IW){ch*=IW/cw;cw=IW;}
  cx=Math.max(cw/2,Math.min(IW-cw/2,cx));cy=Math.max(ch/2,Math.min(IH-ch/2,cy));return{sx:cx-cw/2,sy:cy-ch/2,cw,ch,k:R.w/cw};}
// draw scene key through cam into R; animal = {a, alpha, slide}; returns world->canvas mapping
function view(c,key,cam,R,{animal=null,alpha=1,slide=0,radius=14}={}){
  const f=frame(cam,R),map=([x,y])=>[R.x+(x-f.sx)*f.k,R.y+(y-f.sy)*f.k];
  const cv=cleanScene(key);
  c.save();c.beginPath();c.roundRect(R.x,R.y,R.w,R.h,radius);c.clip();
  if(!cv){c.fillStyle=PANEL;c.fillRect(R.x,R.y,R.w,R.h);}
  else{c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';c.drawImage(cv,f.sx,f.sy,f.cw,f.ch,R.x,R.y,R.w,R.h);}
  if(animal&&alpha>.003){const im=cleanCut(animal),r=cutRect(animal),[x0,y0]=map([r.x+slide,r.y]),fy=map([0,animal.y+animal.feet*animal.sc])[1];
    c.save();c.globalAlpha*=alpha;
    // soft shadow on the ground
    const sg=c.createRadialGradient(0,0,0,0,0,1);c.save();c.translate(x0+r.w*f.k*.55,fy);c.scale(r.w*f.k*.5,r.w*f.k*.07);
    sg.addColorStop(0,'rgba(40,30,20,.32)');sg.addColorStop(1,'rgba(40,30,20,0)');c.fillStyle=sg;c.beginPath();c.arc(0,0,1,0,Math.PI*2);c.fill();c.restore();
    if(im)c.drawImage(im,x0,y0,r.w*f.k,r.h*f.k);c.restore();}
  c.restore();
  D.round(c,R.x,R.y,R.w,R.h,radius,null,C.edge);
  return map;}

// ── layout ────────────────────────────────────────────────────────────────
const VP={x:16,y:62,w:652,h:470};
const CARD={x:684,y:62,w:260,h:470};
const TH={x:CARD.x+14,y:CARD.y+246,w:232,h:150};
const SLOT=[0,1,2,3].map(i=>({x:24+i*232,y:124,w:216,h:180}));
// cameras
const DES0=[707,466.5,1294],DES1=[1025,466.5,1294],CACT=[330,250,560],CAMZ=[1258,560,640];
const TUN0=[836,466.5,1294],TUN1=[1025,466.5,1294],TUNZ=[720,716,600],REINZ=[1340,470,560];
const THUMB=[[320,250,560],[1258,594,470],[720,740,520],[1338,468,430]];
const PATH=[
  [[0,...DES0],[1.4,...DES0],[3.4,...CACT]],
  [[0,...CACT],[.3,...CACT],[1.8,...DES1],[2.6,...DES1],[4.4,...CAMZ]],
  [[0,...TUN0],[1.4,...TUN0],[3.4,...TUNZ]],
  [[0,...TUNZ],[.3,...TUNZ],[1.6,...TUN1],[2.3,...TUN1],[3.8,...REINZ]]];
function camAt(k,tau,t){const p=PATH[k];let v=p[p.length-1].slice(1);
  if(tau<=p[0][0])v=p[0].slice(1);else for(let i=1;i<p.length;i++)if(tau<p[i][0]){const a=p[i-1],b=p[i],u=smooth((tau-a[0])/(b[0]-a[0]));v=[1,2,3].map(j=>mix(a[j],b[j],u));break;}
  // slow breathing keeps a held view alive (zoom in only, so a full view never shows past the picture edge)
  return[v[0]+5*Math.sin(t*.45),v[1]+3*Math.sin(t*.6),v[2]*(1-.014*(.5+.5*Math.sin(t*.7)))];}
const breathe=(v,t)=>[v[0]+5*Math.sin(t*.45),v[1]+3*Math.sin(t*.6),v[2]*(1-.03*(.5+.5*Math.sin(t*.9)))];
const SCENE_OF=k=>k<2?'desert':'tundra';
const NAME=[L('cactus','仙人掌','Cactus'),L('camel','駱駝','Camel'),L('dwarfShrub','矮灌木','Low shrubs'),L('reindeer','馴鹿','Reindeer')];
const PROB=[L('lack','缺水','Water shortage'),L('lack','缺水','Water shortage'),L('shortSeason','冷、生長季短','Cold, short growing season'),L('shortSeason','冷、生長季短','Cold, short growing season')];
const FEAT=[[L('stemStore','莖：儲水','Stem: stores water'),L('spine','刺：減少水分散失','Spines: cut water loss')],[L('hump','駝峰：儲存脂肪，不是水','Hump: stores fat, not water')],
  [L('lowGrowth','貼地生長','Low, close to the ground')],[L('thickFur','厚毛','Thick fur')]];
const ANIMAL=[null,CAMEL,null,REIN];
const SHRUB_LICHEN=(()=>{const a=NAME[2],b=L('lichen','地衣','Lichen');return P(a[0]+'、'+b[0],a[1]+', '+b[1].toLowerCase());})();
const NAME4=[NAME[0],NAME[1],SHRUB_LICHEN,NAME[3]];
const fin=(tau,t0,d=.6)=>ease((tau-t0)/d);

// ── problem -> solution card ──────────────────────────────────────────────
function card(c,k,tau,t,aSol,aProb){
  D.round(c,CARD.x,CARD.y,CARD.w,CARD.h,14,CARD_BG,C.edge);
  withA(c,aProb,()=>{
    tag(c,L('problem','難題','Problem'),CARD.x+14,CARD.y+14,{col:ORANGE,active:true});
    K.wrap(c,PROB[k],CARD.x+CARD.w/2,CARD.y+92,CARD.w-28,26,ORANGE,34,'center');
    const ay=CARD.y+146+4*Math.sin(t*2.2);K.arrow(c,CARD.x+CARD.w/2,ay,CARD.x+CARD.w/2,ay+30,YELLOW,4);});
  withA(c,aSol,()=>{
    const s=tag(c,L('solution','解法','Solution'),CARD.x+14,CARD.y+192,{col:GREEN,active:true});
    if(tau>0&&aSol>=1)pulseRing(c,s,t,GREEN);
    view(c,SCENE_OF(k),breathe(THUMB[k],t),TH,{animal:ANIMAL[k],radius:10});
    text(c,NAME[k],CARD.x+CARD.w/2,TH.y+TH.h+40,24,GREEN,'center');});
}

// ── one step, drawn at its own time tau ────────────────────────────────────
function step(c,k,tau,t){
  const morph=k===3?smooth((tau-5)/.9):0,aUI=1-morph;
  // top pill: habitat
  withA(c,aUI,()=>tag(c,L(SCENE_OF(k),k<2?'沙漠':'凍原',k<2?'Desert':'Tundra'),VP.x,12,{col:k<2?SAND:CYAN,active:true}));
  // camera view (step 3 shrinks it into the last thumbnail)
  const cam=camAt(k,tau,t),R=morph>0?{x:mix(VP.x,SLOT[3].x,morph),y:mix(VP.y,SLOT[3].y,morph),w:mix(VP.w,SLOT[3].w,morph),h:mix(VP.h,SLOT[3].h,morph)}:VP;
  const camM=morph>0?[0,1,2].map(j=>mix(cam[j],breathe(THUMB[3],t+3.9)[j],morph)):cam;
  const aAn=k===1?fin(tau,1.8,.8):k===3?fin(tau,1.6,.8):0;
  const map=view(c,SCENE_OF(k),camM,R,{animal:ANIMAL[k],alpha:aAn,slide:70*(1-aAn)});
  // card
  withA(c,aUI,()=>card(c,k,tau,t,fin(tau,[5.0,5.2,5.0,4.4][k]),k===1||k===3?1:fin(tau,.3)));
  const VR=VP.x+VP.w-10;
  // labels on the view
  if(k===0){
    withA(c,fin(tau,4.3),()=>{const b=box(c,L('spine','刺：減少水分散失','Spines: cut water loss'),VR,262,{al:'right',col:WHITE,maxW:220,minX:VP.x+430});
      pointer(c,[b.x+b.w*.5,b.y-2],map([527,146]),WHITE,t);});
    withA(c,fin(tau,3.6),()=>{const b=box(c,L('stemStore','莖：儲水','Stem: stores water'),VR,392,{al:'right',col:GREEN,maxW:220,minX:VP.x+430});
      pointer(c,[b.x-2,b.y+b.h*.5],map([360,400]),GREEN,t);});
  }
  if(k===1){
    withA(c,fin(tau,4.6),()=>{const h=map(cutPt(CAMEL,CAMEL.hump)),b=box(c,L('hump','駝峰：儲存脂肪，不是水','Hump: stores fat, not water'),h[0],VP.y+12,{al:'center',col:YELLOW,active:true,size:24,maxW:440,minX:VP.x+8,maxX:VR});
      if(tau>5.2)pulseRing(c,b,t,YELLOW);pointer(c,[Math.max(b.x+20,Math.min(b.x+b.w-20,h[0])),b.y+b.h+2],[h[0],h[1]+16],YELLOW,t);});
  }
  if(k===2){
    withA(c,fin(tau,3.6),()=>{const cx=VP.x+92,cy=VP.y+98,r=74,e=.6+.4*ease((tau-3.6)/.6);
      c.save();c.translate(cx,cy);c.scale(e,e);
      c.save();c.beginPath();c.arc(0,0,r,0,Math.PI*2);c.clip();K.drawIn(c,'SU2_lichen.png',{x:-r,y:-r,w:r*2,h:r*2},{crop:[80/800,120/852,260/800,260/852]});c.restore();
      circle(c,0,0,r,null,'rgba(11,26,21,.75)',7);circle(c,0,0,r,null,WHITE,3);c.restore();
      const b=tag(c,L('lichen','地衣','Lichen'),cx+r+10,cy-56,{col:WHITE,minX:VP.x+8,maxX:VR});
      pointer(c,[cx+r*.5,cy+r*.86],map([545,800]),WHITE,t);});
    withA(c,fin(tau,4.4),()=>{const b=box(c,L('lowGrowth','貼地生長','Low, close to the ground'),VR,VP.y+VP.h-96,{al:'right',col:GREEN,maxW:240,minX:VP.x+330});
      pointer(c,[b.x+b.w*.4,b.y-2],map([840,720]),GREEN,t);});
  }
  if(k===3){
    withA(c,fin(tau,4.0)*aUI,()=>{const b=tag(c,L('thickFur','厚毛','Thick fur'),VP.x+12,VP.y+236,{col:WHITE,active:true,minX:VP.x+8});
      pointer(c,[b.x+b.w-6,b.y+b.h+2],map(cutPt(REIN,REIN.fur)),YELLOW,t);});
    // four thumbnails, grouped by problem
    withA(c,morph,()=>{
      [0,1,2].forEach(i=>withA(c,clamp((tau-5.3-i*.25)/.5),()=>view(c,SCENE_OF(i),breathe(THUMB[i],t+i*1.3),SLOT[i],{animal:ANIMAL[i],radius:10})));
      [[0,1,ORANGE],[2,3,CYAN]].forEach(([a,b2,col],j)=>withA(c,clamp((tau-5.6-j*.3)/.5),()=>{
        const x0=SLOT[a].x,x1=SLOT[b2].x+SLOT[b2].w,y=SLOT[a].y-12;
        K.sline(c,[[x0+4,y+8],[x0+4,y],[x1-4,y],[x1-4,y+8]],rgba(col,.9),3);
        tag(c,PROB[a],(x0+x1)/2,y-48,{al:'center',col,active:true});}));
      SLOT.forEach((r,i)=>withA(c,clamp((tau-5.8-i*.2)/.5),()=>{
        const nb=box(c,NAME4[i],r.x+r.w/2,r.y+r.h+10,{al:'center',col:GREEN,maxW:r.w+12,minX:r.x-6,maxX:r.x+r.w+6});
        let y=nb.y+nb.h+28;FEAT[i].forEach(p=>{y+=rowsText(c,p,r.x+r.w/2,y,r.w+10,22,WHITE,28);});}));
      withA(c,clamp((tau-6.6)/.6),()=>{const b=tag(c,SAME_DIFF,CW/2,500,{al:'center',col:YELLOW,active:true,size:26});if(tau>7.2)pulseRing(c,b,t,YELLOW);});
    });
  }
  // notes
  if(k===1||k===3)text(c,L('sizeNoReal','大小不代表真實大小','Sizes are not real sizes'),16,590,22,MUTED,'left');
  text(c,L('aiNote','AI 插圖，非實拍','AI illustration, not a photo'),CW-14,590,22,MUTED,'right');
}

// ── frame ─────────────────────────────────────────────────────────────────
function draw(c,s,t){
  const {k,tau:ck}=K.stageClock(s,t,N,PER);
  s.shown=k;
  PRELOAD.forEach(f=>K.pic(K.src(f)));            // start loading every picture of this view at once
  const st=s.adSt||(s.adSt={});
  if(st.k===undefined){st.k=k;st.from=-1;st.T=t-ck;}
  if(st.k!==k){st.from=st.k;st.fromTau=t-st.T;st.k=k;st.T=t;}
  if(t<st.T){st.T=t-ck;st.from=-1;}
  const tau=t-st.T;
  step(c,k,tau,t);
  if(st.from>=0&&tau<OUT){
    // cross-fade: the previous step, frozen where it was left, fades out over the new one
    c.save();c.globalAlpha*=1-smooth(tau/OUT);c.fillStyle='#11261f';c.fillRect(0,0,CW,600);step(c,st.from,st.fromTau,t);c.restore();}
}
window.EcologyDraw.adapt=draw;
})();
