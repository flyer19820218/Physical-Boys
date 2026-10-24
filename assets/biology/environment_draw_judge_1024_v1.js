/* Unit 11 lesson 2 · "judge" canvas (pollution-eutrophication tab, view 3, supplement), 2026-10-25. Is colour enough? (plan section 3, judge).
 * Three steps, 9 s each; s.shown = step. s.phase<0 plays all, s.phase>=0 holds a step (water surfaces ripple, glints slide,
 * bubbles rise, dots breathe, boxes ring, dashes march).
 * Left 2/3 = stage (x 16..636, y 16..548). Right 1/3 = step card (x 652..944) as in conc: header (VIEWS.judge.tab), three step labels,
 * step title (VIEWS.judge.names), legend for the step. Bottom row: "Supplement" pill (bottom left, every step) and "Schematic"
 * (bottom right, every step).
 *  0 colour only: three glass cups drawn in code, side by side (centres x 126 / 326 / 526): clear, green, oddly coloured; a name pill
 *    under each. Above each cup a small window (180 x 101) with the matching pond: HB5 (clear), TH8 (bloom), and HB5 with its water
 *    surface recoloured orange-brown by the program (offscreen canvas, 'color' blend inside the water outline measured with PIL in
 *    environment_draw_boundary_1024_v1.js) with a "Recoloured" tag. Big question "Which cup is worst?" on top; a white dashed
 *    "No answer yet" box (coming back from step 1/2 these wait 1 s for the cups to grow back); a note "Windows above: the matching pond (AI illustration, not a photo)". No ticks, crosses or ranking.
 *  1 data to add: the cups shrink to the top (1 s move, windows fade), cyan header "Beyond colour, these four kinds of data are
 *    needed", then four cyan cards one by one (2 x 2): dissolved oxygen (white bubbles rising), nutrients (pink dots), time (sun and
 *    moon), depth (water column with a marker moving between surface and bottom); each card = drawn icon + name + "what to look at".
 *  2 safety: cards fade; a white shield with "!" named "Safety"; two rows with drawn icons (a scoop over water, a hand over water,
 *    each inside a white no-sign): "Do not collect", "Do not touch unknown water"; white dashed statement "Colour is a clue, not a test".
 * Colours (plan 1.4): nutrients = pink #f472b6 dots; dissolved oxygen = white bubbles; data still needed = cyan #55e9ff;
 * unknown / clue = white dashed box. Orange (pressure) is not used: nothing here is a pressure arrow. Cup water colours: green =
 * the mean colour of TH8's water (PIL, 78,107,43, lifted a little for the dark board); clear and odd colours are schematic.
 * No numbers or standard values; nothing about drinking or touching except "do not touch unknown water".
 * New labels (P(), not in K.LAB) are in T below.
 */
(()=>{'use strict';
const K=window.EnvironmentKit,{P,C,D,clamp,mix,mod,smooth,ease,rgba,text,measure,circle}=K;
const L=(k,zh,en)=>(K.LAB&&K.LAB[k])||P(zh,en);
const N=3,PER=9,CW=960,MOVE=1;
const WHITE=C.white,MUTED=C.muted,CYAN=K.COL.evidence,PINK=K.COL.nutrient,INK=C.ink,SUN='#fde047';
const FILL='rgba(11,26,21,.92)';
const HB5='HB5_pond.jpg',TH8=(K.ENV||'environment_ai_1024/')+'TH8_pond_bloom.jpg';

// ── labels ────────────────────────────────────────────────────────────────
const T={
 tab:P('看顏色夠不夠','Is colour enough?'),
 short:[P('只看顏色','Colour only'),P('要補的資料','Data to add'),P('安全','Safety')],
 names:[P('三杯水：哪一杯最不好？','Three cups: which is worst?'),P('顏色之外，還要哪些資料','Beyond colour, what data'),P('顏色只是線索，不是檢測','Colour is a clue, not a test')],
 cups:[P('清澈','Clear'),P('綠色','Green'),P('顏色異常','Oddly coloured')],
 question:P('哪一杯最不好？','Which cup is worst?'),
 noAnswer:P('先不作答','No answer yet'),
 recol:P('程式調色','Recoloured'),
 note:P(`上方小窗：對應的池塘（${L('aiNote','AI 插圖，非實拍','AI illustration, not a photo')[0]}）`,`Windows above: the matching pond (${L('aiNote','AI 插圖，非實拍','AI illustration, not a photo')[1]})`),
 need:P('顏色之外，還要這四種資料','Beyond colour, these four kinds of data are needed'),
 cards:[[P('溶氧','Dissolved oxygen'),P('水裡有多少氧氣','How much oxygen is in the water')],
  [P('營養鹽','Nutrients'),P('氮、磷等養分','Nitrogen, phosphorus and other nutrients')],
  [L('time','時間','Time'),P('白天或夜晚、哪一季','Day or night, and which season')],
  [P('深度','Depth'),P('水面或底層','Surface or bottom layer')]],
 safety:P('安全','Safety'),
 noCollect:P('不採集','Do not collect'),
 noTouch:P('不接觸不明水體','Do not touch unknown water'),
 clue:P('顏色只是線索，不是檢測','Colour is a clue, not a test'),
 supp:P('補充','Supplement'),
 schem:L('schematic','示意','Schematic'),
 legCup:P('杯子：程式畫的示意','Cups: drawn schematic'),
 legTint:P('第三窗：程式調色','Third window: recoloured by program'),
 legBub:P('白色小泡泡：溶氧','White bubbles: dissolved oxygen'),
 legDot:P('粉紅小點：營養鹽','Pink dots: nutrients'),
 legCard:P('青框：還要補的資料','Cyan card: data to add'),
 legShield:P('白盾：安全提醒','White shield: safety'),
 legDash:P('白虛線：只是線索','White dashed: only a clue'),
};

// ── geometry ──────────────────────────────────────────────────────────────
const CX=[126,326,526];
const CUP={w:124,h:176};
const GEO=[{top:206,s:1},{top:22,s:.5},{top:22,s:.5}];
const WIN={w:180,h:101,y:82};
const CARD={x:652,y:16,w:292,h:550};
const GRID={x:[16,334],y:[218,388],w:302,h:160};
// HB5 crop shown in the windows (picture px) and its water outline (picture px, measured with PIL; from environment_draw_boundary)
const CROP=[300,240,1050,590],IW=1672,IH=933;
const WATER=[[640,288],[760,262],[900,250],[1060,252],[1150,268],[1040,292],[990,318],[1100,345],[1220,350],[1235,420],[1320,470],[1350,505],
 [1250,525],[1240,600],[1210,690],[1120,770],[900,815],[620,800],[430,760],[405,690],[430,610],[370,540],[290,470],[225,440],[320,380],[450,345],[560,315]];
// water colours [top, bottom]
const WCOL=[['rgba(205,242,250,.14)','rgba(175,228,242,.24)'],['rgb(104,140,58)','rgb(70,98,38)'],['rgb(170,112,56)','rgb(118,74,36)']];

// ── helpers (as in conc) ─────────────────────────────────────────────────
const withA=(c,a,fn)=>{if(a<=0.002)return;c.save();c.globalAlpha*=Math.min(1,a);fn();c.restore();};
const LH=26;
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
function greedy(c,str,w,size=22){const rows=[];let row='';for(const word of str.split(' ')){const tryR=row?row+' '+word:word;if(!row||measure(c,tryR,size)<=w)row=tryR;else{rows.push(row);row=word;}}if(row)rows.push(row);return rows;}
function greedyBal(c,str,w,size=22){const n=greedy(c,str,w,size).length;if(n<2)return greedy(c,str,w,size);let lo=w*.4,hi=w;for(let i=0;i<14;i++){const m=(lo+hi)/2;if(greedy(c,str,m,size).length>n)lo=m;else hi=m;}return greedy(c,str,Math.ceil(hi)+1,size);}
function ring(c,r,t,col){const u=mod(t*.7);D.round(c,r.x-6*u,r.y-6*u,r.w+12*u,r.h+12*u,Math.min(r.h/2,16)+6*u,null,rgba(col,.8*(1-u)));}
function badge(c,n,x,y,active,col=WHITE){circle(c,x,y,15,active?col:'rgba(11,26,21,.92)',active?col:rgba(MUTED,.8),2);
  c.save();c.font=K.MONO(22);c.fillStyle=active?INK:MUTED;c.textAlign='center';c.textBaseline='middle';c.fillText(String(n),x,y+1);c.restore();}
function boxGeo(c,p,maxW,size=22){const pad=28,str=D.tr(p),rows=/[一-鿿]/.test(str)?blines(c,p,maxW-pad,size):greedyBal(c,str,maxW-pad,size);
  const lh=Math.round(size*1.2),w=Math.max(...rows.map(r=>measure(c,r,size)))+pad,h=Math.round(size*1.82)+(rows.length-1)*lh;return{rows,w,h,lh};}
function box(c,p,x,y,{maxW=600,al='left',stroke=WHITE,col=WHITE,fill=FILL,dash=null,t=0,size=22}={}){
  const g=boxGeo(c,p,maxW,size),bx=al==='center'?x-g.w/2:al==='right'?x-g.w:x;
  if(dash){c.save();c.setLineDash(dash);c.lineDashOffset=-t*10;}D.round(c,bx,y,g.w,g.h,g.rows.length>1?16:Math.min(20,g.h/2),fill,stroke);if(dash)c.restore();
  g.rows.forEach((r,i)=>text(c,r,bx+g.w/2,y+Math.round(size*1.27)+i*g.lh,size,col,'center'));
  return{x:bx,y,w:g.w,h:g.h};}
const push=(rects,a,id,q,extra)=>{if(rects&&a>=1)rects.push({id,...q,...(extra||{})});};

// ── the recoloured pond (HB5 with its water surface tinted orange-brown), built once offscreen ───────────────
let ODD=null;
function oddPond(){
  if(ODD)return ODD;
  const im=K.pic(K.src(HB5));if(!im)return null;
  const w=WIN.w*2,h=WIN.h*2,o=document.createElement('canvas');o.width=w;o.height=h;const g=o.getContext('2d');
  g.drawImage(im,CROP[0],CROP[1],CROP[2],CROP[3],0,0,w,h);
  const mx=x=>(x-CROP[0])*w/CROP[2],my=y=>(y-CROP[1])*h/CROP[3];
  g.save();g.beginPath();WATER.forEach(([x,y],i)=>i?g.lineTo(mx(x),my(y)):g.moveTo(mx(x),my(y)));g.closePath();g.clip();
  g.globalCompositeOperation='color';g.fillStyle='rgb(176,108,48)';g.fillRect(0,0,w,h);
  g.globalCompositeOperation='multiply';g.fillStyle='rgb(235,190,140)';g.fillRect(0,0,w,h);
  g.globalCompositeOperation='source-over';g.fillStyle='rgba(150,96,46,.28)';g.fillRect(0,0,w,h);
  g.restore();
  ODD=o;return o;}
function pondWin(c,i,x,y,t){
  const r={x,y,w:WIN.w,h:WIN.h};
  c.save();c.beginPath();c.roundRect(x,y,r.w,r.h,8);c.clip();c.fillStyle='#16332b';c.fillRect(x,y,r.w,r.h);
  if(i===2){const o=oddPond();if(o)c.drawImage(o,x,y,r.w,r.h);}
  else K.drawIn(c,i===0?HB5:TH8,r,{crop:[CROP[0]/IW,CROP[1]/IH,CROP[2]/IW,CROP[3]/IH]});
  // a soft light sweep across the window (keeps a held step moving)
  const u=mod(t*.12+i*.33),sx=x-60+u*(r.w+120),gr=c.createLinearGradient(sx-40,0,sx+40,0);
  gr.addColorStop(0,'rgba(242,236,217,0)');gr.addColorStop(.5,'rgba(242,236,217,.10)');gr.addColorStop(1,'rgba(242,236,217,0)');
  c.fillStyle=gr;c.fillRect(x,y,r.w,r.h);c.restore();
  D.round(c,x,y,r.w,r.h,8,null,rgba(WHITE,.55));
  return r;}

// ── a glass cup (drawn, schematic) ───────────────────────────────────────
function cupPath(c,x,top,w,h){const bw=w*.8,r=Math.min(14,w*.12);
  c.beginPath();c.moveTo(x-w/2,top);c.lineTo(x-bw/2,top+h-r);c.quadraticCurveTo(x-bw/2,top+h,x-bw/2+r,top+h);
  c.lineTo(x+bw/2-r,top+h);c.quadraticCurveTo(x+bw/2,top+h,x+bw/2,top+h-r);c.lineTo(x+w/2,top);}
function cup(c,i,x,top,s,t){
  const w=CUP.w*s,h=CUP.h*s,wl=top+h*.22,half=y=>mix(w/2,w*.4,(y-top)/h),ph=i*1.7;
  // water
  c.save();cupPath(c,x,top,w,h);c.closePath();c.clip();
  const g=c.createLinearGradient(0,wl,0,top+h);g.addColorStop(0,WCOL[i][0]);g.addColorStop(1,WCOL[i][1]);
  c.fillStyle=g;c.fillRect(x-w/2-2,wl,w+4,h);
  // suspended specks in the green and the odd cup (colour texture only)
  if(i>0){const R=K.rng(31+i*7);for(let n=0;n<16;n++){const px=x+(R()-.5)*w*.7,py=wl+10*s+R()*(h*.72),dx=Math.sin(t*.8+n)*3*s,dy=Math.cos(t*.6+n*1.3)*2*s;
    circle(c,px+dx,py+dy,Math.max(1.2,2.2*s),i===1?'rgba(170,210,90,.55)':'rgba(214,160,100,.5)',null);}}
  c.restore();
  // surface (ripples)
  const rx=half(wl),ry=Math.max(3,(7+1.6*Math.sin(t*2.2+ph))*s);
  K.ellipse(c,x,wl,rx,ry,i===0?'rgba(205,240,246,.30)':i===1?'rgb(122,160,70)':'rgb(190,130,70)',rgba(WHITE,.35),1.5);
  // glass
  c.save();c.lineJoin='round';c.lineWidth=Math.max(2,3*s);c.strokeStyle=rgba(WHITE,.85);cupPath(c,x,top,w,h);c.stroke();c.restore();
  K.ellipse(c,x,top,w/2,Math.max(3,8*s),null,rgba(WHITE,.85),Math.max(1.5,2.5*s));
  // glint sliding down the glass
  const gy=top+h*(.15+.6*mod(t*.18+i*.3));
  c.save();c.lineCap='round';c.strokeStyle=rgba(WHITE,.35);c.lineWidth=Math.max(2,4*s);c.beginPath();
  const gx=x-half(gy)+10*s;c.moveTo(gx,gy);c.lineTo(gx+2*s,gy+26*s);c.stroke();c.restore();
  return{x:x-w/2,y:top-8*s,w,h:h+8*s};}

// ── icons for the four data cards (64 x 64, local origin top-left) ───────
function waterSq(c,x,y){D.round(c,x,y,64,64,10,'#1f4a55',rgba(WHITE,.5));}
function iconDO(c,x,y,t){waterSq(c,x,y);c.save();c.beginPath();c.roundRect(x,y,64,64,10);c.clip();
  for(let n=0;n<6;n++){const u=mod(t*.35+n/6),bx=x+10+((n*23)%44)+Math.sin(t*2+n)*2,by=y+60-u*58;circle(c,bx,by,3+(n%3),null,rgba(WHITE,.9*(1-u*.4)),2);}c.restore();}
function iconNu(c,x,y,t){waterSq(c,x,y);const R=K.rng(5);for(let n=0;n<9;n++){const px=x+10+R()*44,py=y+10+R()*44,r=4*(1+.15*Math.sin(t*2.2+n));
  circle(c,px+Math.sin(t*.7+n)*2,py+Math.cos(t*.6+n)*2,r,PINK,rgba(INK,.6),1.2);}}
function iconTime(c,x,y,t){D.round(c,x,y,64,64,10,'#16332b',rgba(WHITE,.5));
  // sun (day) left, moon (night) right, a small arrow turning between them
  const sx=x+20,sy=y+24,a=t*.6;c.save();c.strokeStyle=SUN;c.lineWidth=2.5;for(let n=0;n<8;n++){const q=a+n*Math.PI/4;c.beginPath();c.moveTo(sx+Math.cos(q)*10,sy+Math.sin(q)*10);c.lineTo(sx+Math.cos(q)*14,sy+Math.sin(q)*14);c.stroke();}c.restore();
  circle(c,sx,sy,7,SUN,null);
  c.save();c.beginPath();c.arc(x+46,y+40,11,0,Math.PI*2);c.fillStyle=WHITE;c.fill();c.globalCompositeOperation='source-atop';c.beginPath();c.arc(x+52,y+36,10,0,Math.PI*2);c.fillStyle='#16332b';c.fill();c.restore();
  c.save();c.strokeStyle=rgba(WHITE,.6);c.lineWidth=2;c.setLineDash([4,4]);c.lineDashOffset=-t*8;c.beginPath();c.arc(x+32,y+32,26,Math.PI*.1,Math.PI*.9);c.stroke();c.restore();}
function iconDepth(c,x,y,t){D.round(c,x,y,64,64,10,'#16332b',rgba(WHITE,.5));
  const g=c.createLinearGradient(0,y+10,0,y+58);g.addColorStop(0,'#2f6b78');g.addColorStop(1,'#123540');
  c.fillStyle=g;c.fillRect(x+14,y+10,26,48);c.strokeStyle=rgba(WHITE,.6);c.lineWidth=1.5;c.strokeRect(x+14,y+10,26,48);
  K.sline(c,[[x+10,y+12],[x+44,y+12]],WHITE,2);K.sline(c,[[x+10,y+56],[x+44,y+56]],WHITE,2);
  const u=.5+.5*Math.sin(t*1.2),my=mix(y+14,y+54,u);K.arrow(c,x+52,y+12,x+52,y+54,CYAN,2.5);circle(c,x+27,my,4,CYAN,null);}
const ICONS=[iconDO,iconNu,iconTime,iconDepth];

// ── safety icons ─────────────────────────────────────────────────────────
function shield(c,x,y,sz,t){const p=1+.03*Math.sin(t*2.4),w=sz*p,h=sz*1.18*p;
  c.save();c.translate(x,y);c.beginPath();c.moveTo(0,-h/2);c.quadraticCurveTo(w*.3,-h*.36,w/2,-h*.4);c.lineTo(w/2,-h*.02);
  c.quadraticCurveTo(w*.44,h*.32,0,h/2);c.quadraticCurveTo(-w*.44,h*.32,-w/2,-h*.02);c.lineTo(-w/2,-h*.4);c.quadraticCurveTo(-w*.3,-h*.36,0,-h/2);c.closePath();
  c.fillStyle=rgba(WHITE,.10);c.fill();c.lineWidth=4;c.strokeStyle=WHITE;c.stroke();
  c.fillStyle=WHITE;c.beginPath();c.roundRect(-5,-h*.26,10,h*.36,5);c.fill();circle(c,0,h*.2,6,WHITE,null);c.restore();
  return{x:x-w/2,y:y-h/2,w,h};}
function noSign(c,x,y,r,t,draw){c.save();c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.clip();draw();c.restore();
  const pul=.75+.25*Math.sin(t*2.6);c.save();c.strokeStyle=rgba(WHITE,pul);c.lineWidth=4;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.stroke();
  c.beginPath();c.moveTo(x-r*.7,y-r*.7);c.lineTo(x+r*.7,y+r*.7);c.stroke();c.restore();}
function waves(c,x,y,w,t){c.save();c.strokeStyle=rgba(CYAN,.8);c.lineWidth=2.5;c.beginPath();for(let i=0;i<=w;i+=2){const yy=y+Math.sin(i*.25+t*2.5)*3;i?c.lineTo(x+i,yy):c.moveTo(x+i,yy);}c.stroke();c.restore();}
function scoopIcon(c,x,y,r,t){noSign(c,x,y,r,t,()=>{waves(c,x-r,y+r*.55,2*r,t);
  // a sample bottle (cap, neck, body) held over the water
  const s=r/30,b=Math.sin(t*1.6)*1.5;c.save();c.translate(x,y-2*s+b);c.fillStyle=rgba(WHITE,.25);c.strokeStyle=WHITE;c.lineWidth=2.5;
  c.beginPath();c.roundRect(-9*s,-6*s,18*s,24*s,4*s);c.fill();c.stroke();
  c.beginPath();c.rect(-5*s,-12*s,10*s,6*s);c.stroke();c.fillStyle=WHITE;c.beginPath();c.roundRect(-7*s,-19*s,14*s,7*s,2*s);c.fill();c.restore();});}
function handIcon(c,x,y,r,t){noSign(c,x,y,r,t,()=>{waves(c,x-r,y+r*.55,2*r,t);
  c.save();c.fillStyle=rgba(WHITE,.9);const s=r/30;c.translate(x,y-2*s);
  c.beginPath();c.roundRect(-11*s,-2*s,22*s,20*s,6*s);c.fill();
  [[-11,-14],[-5.5,-18],[0,-19],[5.5,-17]].forEach(([fx,fy])=>{c.beginPath();c.roundRect(fx*s,fy*s,5*s,18*s,2.5*s);c.fill();});
  c.beginPath();c.roundRect(10*s,2*s,10*s,5*s,2.5*s);c.fill();c.restore();});}

// ── frame ─────────────────────────────────────────────────────────────────
const s_dbg={};
function draw(c,s,t){
  const {k,tau:ct}=K.stageClock(s,t,N,PER);
  s.shown=k;
  const st=s.judgeSt||(s.judgeSt={});
  if(st.k===undefined){st.k=k;st.from=-1;st.T=t-Math.max(0,ct);st.start=s.start;}
  if(st.k!==k){st.from=st.k;st.k=k;st.T=t;st.start=s.start;}
  else if(st.start!==s.start){st.start=s.start;st.from=-1;st.T=t;}
  if(t<st.T){st.T=t;st.from=-1;}
  const tau=t-st.T,x=clamp(tau/MOVE),moving=st.from>=0&&x<1,u=moving?smooth(x):1;
  const rects=[];s_dbg.rects=rects;s_dbg.k=k;
  if(moving)scene(c,st.from,99,t,1-clamp(x*2.2),null);
  // cups (shared by all steps; move between the big row and the small row)
  const g0=moving?GEO[st.from]:GEO[k],g1=GEO[k],top=mix(g0.top,g1.top,u),sc=mix(g0.s,g1.s,u);
  const ca=i=>k===0&&!moving?clamp((tau-.3-i*.3)/.5):1;
  CX.forEach((cx,i)=>withA(c,ca(i),()=>{const r=cup(c,i,cx,top,sc,t);push(rects,ca(i),'cup'+i,r,{pic:true});
    const q=box(c,T.cups[i],cx,top+CUP.h*sc+(sc>.75?14:8),{maxW:196,al:'center'});push(rects,ca(i),'name'+i,q);}));
  scene(c,k,k===0&&st.from>=0?tau-MOVE:tau,t,1,rects);   // back to step 0: windows and question wait until the cups have grown back
  card(c,k,st,moving,x,u,tau,t,rects);
  // bottom row: supplement (left), schematic (right)
  const q=box(c,T.supp,16,560,{stroke:rgba(WHITE,.6),col:MUTED});push(rects,1,'supp',q);
  const tw=measure(c,T.schem,22);text(c,T.schem,CW-16,592,22,MUTED,'right');push(rects,1,'schem',{x:CW-16-tw,y:574,w:tw,h:24});
}
function scene(c,k,tau,t,a,rects){
  if(a<=0.002)return;
  const at=(d,dur=.5)=>clamp((tau-d)/dur);
  withA(c,a,()=>{if(k===0)colourOnly(c,tau,t,rects,at);else if(k===1)dataAdd(c,tau,t,rects,at);else safety(c,tau,t,rects,at);});
}
function colourOnly(c,tau,t,rects,at){
  const qa=at(0,.5);
  withA(c,qa,()=>{const q=box(c,T.question,326,16,{maxW:600,al:'center',size:30});push(rects,qa,'question',q);if(tau<99)ring(c,q,t,WHITE);});
  CX.forEach((cx,i)=>{const wa=at(.2+i*.3,.5);withA(c,wa,()=>{const r=pondWin(c,i,cx-WIN.w/2,WIN.y,t);push(rects,wa,'win'+i,r,{pic:true});
    K.dashed(c,[[cx,WIN.y+WIN.h+3],[cx,GEO[0].top-12]],rgba(WHITE,.5),2,[4,4],-t*8);
    if(i===2){const tw=measure(c,T.recol,22)+16,tx=cx+WIN.w/2-tw-4,ty=WIN.y+WIN.h-34;D.round(c,tx,ty,tw,30,8,FILL,null);text(c,T.recol,tx+tw/2,ty+23,22,WHITE,'center');
      push(rects,wa,'recol',{x:tx,y:ty,w:tw,h:30,inPic:'win2'});}});});
  const na=at(3,.5);
  withA(c,na,()=>{const q=box(c,T.noAnswer,326,456,{maxW:400,al:'center',dash:[8,6],t});push(rects,na,'noAnswer',q);});
  const ta=at(3.8,.6);
  withA(c,ta,()=>{const rows=blines(c,T.note,600);rows.forEach((r,i)=>text(c,r,326,522+i*LH,22,MUTED,'center'));
    const w=Math.max(...rows.map(r=>measure(c,r,22)));push(rects,ta,'note',{x:326-w/2,y:504,w,h:rows.length*LH});});
}
function dataAdd(c,tau,t,rects,at){
  const ha=at(1,.5);
  withA(c,ha,()=>{const q=box(c,T.need,326,168,{maxW:620,al:'center',stroke:CYAN,col:CYAN});push(rects,ha,'need',q);});
  T.cards.forEach(([nm,what],i)=>{const ca=at(1.8+i*1,.5),x=GRID.x[i%2],y=GRID.y[i>>1];
    withA(c,ca,()=>{const z=mix(.85,1,ease(ca));c.save();c.translate(x+GRID.w/2,y+GRID.h/2);c.scale(z,z);c.translate(-x-GRID.w/2,-y-GRID.h/2);
      const r={x,y,w:GRID.w,h:GRID.h};D.round(c,x,y,r.w,r.h,14,'rgba(22,51,43,.95)',CYAN);
      ICONS[i](c,x+14,y+16,t);
      const tx=x+92,tw=r.w-104;text(c,nm,tx,y+40,22,CYAN);bwrap(c,what,tx,y+72,tw,22,WHITE,LH);
      c.restore();push(rects,ca,'card'+i,r);
      if(tau<99&&tau>1.8+i&&tau<2.8+i)ring(c,r,t,CYAN);});});
}
function safety(c,tau,t,rects,at){
  const sa=at(.6,.5);
  withA(c,sa,()=>{const r=shield(c,100,262,96,t);push(rects,sa,'shield',r,{pic:true});
    const q=box(c,T.safety,100,330,{maxW:170,al:'center'});push(rects,sa,'safetyName',q);});
  [[T.noCollect,scoopIcon],[T.noTouch,handIcon]].forEach(([p,fn],i)=>{const ra=at(1.4+i*.8,.5),y=200+i*96;
    withA(c,ra,()=>{fn(c,232,y+36,32,t);push(rects,ra,'icon'+i,{x:198,y:y+2,w:68,h:68,pic:true});
      const rows=blines(c,p,350,26);rows.forEach((r,j)=>text(c,r,284,y+46-(rows.length-1)*15+j*30,26,WHITE));
      const w=Math.max(...rows.map(r=>measure(c,r,26)));push(rects,ra,'row'+i,{x:284,y:y+24-(rows.length-1)*15,w,h:rows.length*30});});});
  const ca=at(3.2,.6);
  withA(c,ca,()=>{const q=box(c,T.clue,326,430,{maxW:600,al:'center',dash:[8,6],t,size:26});push(rects,ca,'clue',q);if(tau<99&&tau>3.2)ring(c,q,t,WHITE);});
}

// ── step card (right) ─────────────────────────────────────────────────────
function legend(k){
  if(k===0)return[['cup',T.legCup],['tint',T.legTint]];
  if(k===1)return[['bub',T.legBub],['dot',T.legDot],['card',T.legCard]];
  return[['shield',T.legShield],['dash',T.legDash]];}
function legIcon(c,kind,x,y,t,pul){
  if(kind==='cup'){c.save();c.lineWidth=2;c.strokeStyle=rgba(WHITE,.7+.3*pul);cupPath(c,x+20,y,28,26);c.stroke();c.restore();}
  else if(kind==='win'){D.round(c,x,y,40,26,5,'#2f5a4a',rgba(WHITE,.7+.3*pul));}
  else if(kind==='tint'){D.round(c,x,y,40,26,5,'rgb(150,98,48)',rgba(WHITE,.7+.3*pul));}
  else if(kind==='bub'){[[10,18,4],[22,10,5],[32,18,3]].forEach(([dx,dy,r],i)=>circle(c,x+dx,y+dy-2*Math.sin(t*2+i),r,null,WHITE,2));}
  else if(kind==='dot'){[[10,13],[20,9],[30,15]].forEach(([dx,dy],i)=>circle(c,x+dx,y+dy,4*(1+.15*Math.sin(t*2.2+i)),PINK,rgba(INK,.6),1.2));}
  else if(kind==='card'){D.round(c,x,y,40,26,6,FILL,rgba(CYAN,.7+.3*pul));}
  else if(kind==='shield'){c.save();c.translate(x+20,y+13);c.scale(.25,.25);c.translate(-x-20,-y-13);shield(c,x+20,y+13,96,t);c.restore();}
  else{c.save();c.setLineDash([6,4]);c.lineDashOffset=-t*10;D.round(c,x,y,40,26,13,FILL,rgba(WHITE,.7+.3*pul));c.restore();}}
function card(c,k,st,moving,x,u,tau,t,rects){
  const R=CARD,ix=R.x+16,iw=R.w-32;
  D.round(c,R.x,R.y,R.w,R.h,14,'rgba(22,51,43,.95)',C.edge);
  const hr=box(c,T.tab,ix,R.y+14,{maxW:iw});push(rects,1,'tab',hr,{card:true});
  let y=R.y+14+hr.h+14;
  K.sline(c,[[ix,y],[ix+iw,y]],rgba(WHITE,.25),2);y+=12;
  T.short.forEach((p,j)=>{
    const on=j===k?(moving?u:1):(moving&&j===st.from?1-u:0),cy=y+20,rows=blines(c,p,iw-42),hh=Math.max(40,40+(rows.length-1)*LH);
    if(on>0)withA(c,on,()=>D.round(c,ix-6,y,iw+12,hh,12,'rgba(242,236,217,.10)',null));
    if(on<1)badge(c,j+1,ix+16,cy,false);withA(c,on,()=>badge(c,j+1,ix+16,cy,true,WHITE));
    rows.forEach((r,i)=>text(c,r,ix+42,cy+8+i*LH,22,on>.5?WHITE:MUTED));
    y+=hh+2;});
  K.sline(c,[[ix,y+2],[ix+iw,y+2]],rgba(WHITE,.25),2);y+=16;
  const ty=y+22;
  if(moving&&st.from>=0)withA(c,1-clamp(x*2.5),()=>bwrap(c,T.names[st.from],ix,ty,iw,22,WHITE,30));
  const na=clamp((tau-(moving?MOVE*.6:0))/.5);
  const hh=blines(c,T.names[k],iw).length*30;withA(c,na,()=>bwrap(c,T.names[k],ix,ty,iw,22,WHITE,30));
  if(rects)rects.push({id:'cardTitle',x:ix,y:ty-22,w:iw,h:hh,card:true});
  const legs=legend(k),lhs=legs.map(([,p])=>Math.max(40,blines(c,p,iw-50).length*28+10));
  const ly=R.y+R.h-12-lhs.reduce((a,b)=>a+b,0);
  s_dbg.title=ty+hh-22;s_dbg.legend=ly;
  const la=moving?clamp((x-.4)/.6):1;
  let yy=ly;
  withA(c,la,()=>legs.forEach(([kind,p],q)=>{const pul=.5+.5*Math.sin(t*2+q);
    legIcon(c,kind,ix,yy+4,t,pul);
    bwrap(c,p,ix+50,yy+24,iw-50,22,WHITE,28);yy+=lhs[q];}));
}
window.EnvironmentDraw=window.EnvironmentDraw||{};
window.EnvironmentDraw.judge=draw;
window.EnvironmentDraw.judge.dbg=s_dbg;
})();
