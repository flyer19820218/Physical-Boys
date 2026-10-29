/* Human inheritance · teacher-requested V5 remake, 2026-10-21.
 * Four tabs: human traits in the textbook's one-gene model (with a visible side note that real traits are
 * not that simple), ABO blood groups on a Punnett square, the textbook's token-drawing activity, and
 * chromosomes / sex determination. Faces are the teacher's Gemini AI illustrations (human_ai_1021/);
 * alleles, gametes, chromosomes and charts are drawn in code. Sperm-borne alleles and chromosomes are
 * cyan and egg-borne ones pink, as in the reproduction units and the Mendel unit; dominant forms green,
 * recessive forms orange, as in the Mendel unit. Multiple-choice checks: genetics_quiz_1020_v1.js.
 * Replaces the human_inheritance entry of genetics_lessons_1010_v1.js (left in that file, unused).
 */
(()=>{'use strict';
const B=window.LivingBook,D=B.D,P=(zh,en)=>[zh,en];
const C={white:'#f2ecd9',yellow:'#fde047',cyan:'#55e9ff',green:'#4ade80',orange:'#fb923c',pink:'#f472b6',panel:'#1c3d34',deep:'#0b1a15',muted:'#b9cbbd',edge:'#47675d',ink:'#0b1a15'};
const TAU=Math.PI*2,clamp=n=>Math.max(0,Math.min(1,n)),mix=(a,b,u)=>a+(b-a)*u,mod=(n,d=1)=>((n%d)+d)%d,ease=u=>1-Math.pow(1-clamp(u),3);
const rgba=(hex,a)=>{const n=parseInt(hex.slice(1),16);return `rgba(${n>>16&255},${n>>8&255},${n&255},${a})`;};

// ── drawing kit (same helpers as the Mendel unit) ──────────────────────────
function line(c,pts,color,w=3){D.line(c,pts,color,w);}
function sline(c,pts,color,w){c.save();c.lineCap='round';c.lineJoin='round';c.beginPath();pts.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.strokeStyle=color;c.lineWidth=w;c.stroke();c.restore();}
function circle(c,x,y,r,fill,stroke,w=3){c.beginPath();c.arc(x,y,r,0,TAU);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=w;c.stroke();}}
function ellipse(c,x,y,rx,ry,fill,stroke,w=3,rot=0){c.beginPath();c.ellipse(x,y,rx,ry,rot,0,TAU);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=w;c.stroke();}}
const FONT=size=>`700 ${size}px "Noto Sans TC", "JetBrains Mono", sans-serif`;
const MONO=size=>`700 ${size}px "JetBrains Mono", "Noto Sans TC", monospace`;
function text(c,p,x,y,size=22,color=C.white,align='left',font=FONT){c.save();c.font=font(size);c.fillStyle=color;c.textAlign=align;c.fillText(D.tr(p),x,y);c.restore();}
function measure(c,p,size,font=FONT){c.save();c.font=font(size);const w=c.measureText(D.tr(p)).width;c.restore();return w;}
function splitLines(c,str,maxW,size=22){
  c.save();c.font=FONT(size);
  const isEn=/[A-Za-z]/.test(str)&&!/[一-鿿]/.test(str),tokens=isEn?(str.match(/[A-Za-z0-9₁₂]+(?:['–-][A-Za-z0-9₁₂]+)*|\s+|[^A-Za-z0-9₁₂\s]/g)||[]):Array.from(str);
  const rows=[];let row='';
  for(const tk of tokens){if(c.measureText(row+tk).width>maxW&&row.trim()){rows.push(row.trimEnd());row=tk.trimStart();}else row+=tk;}
  if(row.trim())rows.push(row.trimEnd());
  c.restore();return rows;
}
function wrap(c,p,x,y,w,size=22,color=C.white,lh=Math.round(size*1.38),align='left'){
  const rows=splitLines(c,D.tr(p),w,size),PUNCT=/^[，。、；：！？）」』,.;:!?)]/;
  for(let i=1;i<rows.length;i++)while(PUNCT.test(rows[i])&&rows[i-1].length>1){
    if(/[A-Za-z]/.test(rows[i-1])&&!/[一-鿿]/.test(rows[i-1])){rows[i-1]+=rows[i][0];rows[i]=rows[i].slice(1).trimStart();}else{rows[i]=rows[i-1].slice(-1)+rows[i];rows[i-1]=rows[i-1].slice(0,-1);}}
  rows.filter(r=>r).forEach((r,i)=>text(c,r,x,y+i*lh,size,color,align));return rows.length*lh;}
function glow(c,x,y,r,color=C.cyan,a=.55){c.save();const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,rgba(color,1));g.addColorStop(1,rgba(color,0));c.globalAlpha=a;c.fillStyle=g;c.beginPath();c.arc(x,y,r,0,TAU);c.fill();c.restore();}
function arrow(c,x1,y1,x2,y2,color,w=3.5){
  const a=Math.atan2(y2-y1,x2-x1),dist=Math.hypot(x2-x1,y2-y1),hl=Math.min(16,Math.max(8,dist*.46)),hw=hl*.66;
  line(c,[[x1,y1],[x2-hl*.7*Math.cos(a),y2-hl*.7*Math.sin(a)]],color,w);
  c.save();c.beginPath();c.moveTo(x2,y2);
  c.lineTo(x2-hl*Math.cos(a)+hw*Math.sin(a),y2-hl*Math.sin(a)-hw*Math.cos(a));
  c.lineTo(x2-hl*Math.cos(a)-hw*Math.sin(a),y2-hl*Math.sin(a)+hw*Math.cos(a));
  c.closePath();c.fillStyle=color;c.fill();c.restore();
}
function panel(c,x,y,w,h,fill='#16332b'){D.round(c,x,y,w,h,16,fill,C.edge);}
function pill(c,p,x,y,{active=false,color=C.yellow,size=22,maxX=940,minX=24}={}){
  const w=measure(c,p,size)+28,h=size+18;x=Math.max(minX,Math.min(x,maxX-w));
  D.round(c,x,y,w,h,h/2,active?color:'rgba(11,26,21,.9)',active?C.white:rgba(color,.8));
  text(c,p,x+w/2,y+h/2+size*.36,size,active?C.deep:color,'center');
  return{x,y,w,h};
}
function pulse(c,x,y,t,color=C.yellow,r=16){const u=mod(t*.8);circle(c,x,y,r+u*16,null,rgba(color,.9*(1-u)),3);}
function dashed(c,x,y,w,h,label){c.save();c.setLineDash([8,6]);D.round(c,x,y,w,h,12,'rgba(11,26,21,.35)',rgba(C.muted,.5));c.restore();if(label)text(c,label,x+w/2,y+h/2+8,22,C.muted,'center');}
function stepList(c,names,cur,x,y,gap=34){names.forEach((p,i)=>text(c,`${i+1} ${D.tr(p)}`,x,y+i*gap,22,i===cur?C.yellow:rgba(C.muted,.75)));}
const choice=(label,key,items)=>({label,items:items.map(([value,text])=>({key,value,label:text}))});
// A stage clock: loops through n stages, or eases into a held stage.
function stageClock(s,t,n,per=5){
  if(s.phase>=0)return{k:s.phase,u:ease((t-(s.start||0))/1.6),held:true,tau:t-(s.start||0)};
  const q=mod(t-(s.start||0),n*per)/per;return{k:Math.floor(q),u:q%1,held:false,tau:(q%1)*per};
}
function rng(seed){let a=seed>>>0;return()=>{a=a+0x6D2B79F5>>>0;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
const gcd=(a,b)=>b?gcd(b,a%b):a;
function ratio(nums){const g=nums.reduce((a,b)=>gcd(a,b));return nums.map(n=>n/g).join('：');}
const enRatio=s=>s.replace(/：/g,' : ');

// ── pictures ───────────────────────────────────────────────────────────────
const AI='assets/biology/human_ai_1021/',PICS={};
function pic(path){let im=PICS[path];if(!im){im=new Image();im.onload=()=>B.draw();im.onerror=()=>{im.failed=true;};im.src=path;PICS[path]=im;}return im.complete&&im.naturalWidth?im:null;}
function place(c,file,bx,by,bw,bh,{crop=[0,0,1,1],alpha=1}={}){
  const im=pic(AI+file);if(!im)return null;const [fx,fy,fw,fh]=crop,sw=im.naturalWidth*fw,sh=im.naturalHeight*fh,k=Math.min(bw/sw,bh/sh),w=sw*k,h=sh*k,x=bx+(bw-w)/2,y=by+(bh-h)/2;
  c.save();c.globalAlpha=alpha;c.drawImage(im,im.naturalWidth*fx,im.naturalHeight*fy,sw,sh,x,y,w,h);c.restore();return{x,y,w,h};
}

// ── plain alleles (A / a) ──────────────────────────────────────────────────
const SPERM=C.cyan,EGG=C.pink,PLAIN=C.white;
function chip(c,x,y,letter,fill,size=30){D.round(c,x-size/2,y-size/2,size,size,7,fill,C.ink);c.save();c.font=MONO(Math.max(22,Math.round(size*.78)));c.fillStyle=C.ink;c.textAlign='center';c.textBaseline='middle';c.fillText(letter,x,y+1);c.restore();}
function gamete(c,x,y,letter,col,r=24){circle(c,x,y,r,rgba(col,.16),col,3);c.save();c.font=MONO(28);c.fillStyle=C.white;c.textAlign='center';c.textBaseline='middle';c.fillText(letter,x,y+1);c.restore();}
// Two chips, dominant letter first; each keeps the colour of the gamete it came in.
function pairChips(c,x,y,items,size=30,gap=4){const list=items[0][0]==='A'||items[1][0]!=='A'?items:[items[1],items[0]];const w=2*size+gap;list.forEach(([l,col],i)=>chip(c,x-w/2+size/2+i*(size+gap),y,l,col,size));}

// ── ABO alleles: Iᴬ, Iᴮ, i drawn with a real superscript ───────────────────
const AL_ORDER='ABi',alSort=(a,b)=>AL_ORDER.indexOf(a)-AL_ORDER.indexOf(b);
const typeOf=g=>/A/.test(g)&&/B/.test(g)?'AB':/A/.test(g)?'A':/B/.test(g)?'B':'O';
const TYPES=['A','B','AB','O'],TYPE_COL={A:C.orange,B:C.green,AB:C.yellow,O:C.white};
const gstr=code=>[...code].sort(alSort).join('').replace(/A/g,'Iᴬ').replace(/B/g,'Iᴮ');
const tname=t=>P(`${t} 型`,`type ${t}`);
function alleleGlyph(c,al,x,y,size,color){
  c.save();c.fillStyle=color;c.textBaseline='middle';c.textAlign='left';
  if(al==='i'){c.font=MONO(Math.round(size));const w=c.measureText('i').width;c.fillText('i',x-w/2,y+1);}
  else{const s1=Math.round(size),s2=Math.max(14,Math.round(size*.62));c.font=MONO(s1);const w1=c.measureText('I').width;c.font=MONO(s2);const w2=c.measureText(al).width,x0=x-(w1+w2)/2;c.font=MONO(s1);c.fillText('I',x0,y+1);c.font=MONO(s2);c.fillText(al,x0+w1,y-s1*.3);}
  c.restore();
}
const alW=(al,size)=>al==='i'?size:Math.round(size*1.3);
function abChip(c,x,y,al,fill,size=34){const w=alW(al,size);D.round(c,x-w/2,y-size/2,w,size,7,fill,C.ink);alleleGlyph(c,al,x,y,Math.round(size*.74),C.ink);}
function abGamete(c,x,y,al,col,r=24){circle(c,x,y,r,rgba(col,.16),col,3);alleleGlyph(c,al,x,y,26,C.white);}
// Inline text with alleles: tokens are {t:[zh,en]|string,col} or {al,col}.
const T=(t,col)=>({t,col}),AL=(al,col)=>({al,col}),genoTok=(code,col)=>[...code].sort(alSort).map(a=>AL(a,col));
function rich(c,tokens,x,y,size=22,color=C.white,align='left'){
  const parts=[];c.save();
  for(const tk of tokens){
    if(tk.al){const s2=Math.max(14,Math.round(size*.62));c.font=MONO(size);const main=tk.al==='i'?'i':'I';parts.push({s:main,f:MONO(size),w:c.measureText(main).width,col:tk.col,dy:0});
      if(tk.al!=='i'){c.font=MONO(s2);parts.push({s:tk.al,f:MONO(s2),w:c.measureText(tk.al).width+1,col:tk.col,dy:-size*.36});}}
    else{const s=D.tr(tk.t);c.font=FONT(size);parts.push({s,f:FONT(size),w:c.measureText(s).width,col:tk.col,dy:0});}
  }
  const W=parts.reduce((a,p)=>a+p.w,0);let xx=align==='center'?x-W/2:align==='right'?x-W:x;c.textAlign='left';
  for(const p of parts){c.font=p.f;c.fillStyle=p.col||color;c.fillText(p.s,xx,y+p.dy);xx+=p.w;}
  c.restore();return W;
}
function drop(c,x,y,r,type,alpha=1){
  c.save();c.globalAlpha=alpha;c.beginPath();c.moveTo(x,y-r*1.9);c.bezierCurveTo(x+r*.35,y-r*1.25,x+r,y-r*.75,x+r,y);c.arc(x,y,r,0,Math.PI);c.bezierCurveTo(x-r,y-r*.75,x-r*.35,y-r*1.25,x,y-r*1.9);c.closePath();
  const g=c.createRadialGradient(x-r*.35,y-r*.3,r*.1,x,y,r*1.25);g.addColorStop(0,'#ff8f8f');g.addColorStop(.5,'#d63b4b');g.addColorStop(1,'#8c1c2b');c.fillStyle=g;c.fill();c.strokeStyle=C.ink;c.lineWidth=2;c.stroke();
  if(type){c.font=FONT(Math.round(r*(type.length>1?.8:1)));c.fillStyle='#fff7ec';c.textAlign='center';c.textBaseline='middle';c.fillText(type,x,y+r*.06);}
  c.restore();
}

// ── Tab 1: human traits, as the textbook teaches them ──────────────────────
const TRAITS=[
 {id:'eyelid',name:P('眼皮','Eyelids'),dom:P('雙眼皮','Double'),rec:P('單眼皮','Single'),img:['eyes_double.png','eyes_single.png'],crop:[0,0,1,1],spots:[[[.52,.46]],[[.52,.46]]],
  text:P('依課本：雙眼皮是顯性，單眼皮是隱性。補充：眼皮的樣子也和眼睛周圍的皮膚、脂肪有關；有人小時候是單眼皮，長大才變成雙眼皮。','In the textbook model, double eyelids are dominant and single eyelids recessive. Extra: eyelid shape also depends on the skin and fat around the eye, and some children with single eyelids grow a crease later.')},
 {id:'earlobe',name:P('耳垂','Earlobes'),dom:P('耳垂分離','Free'),rec:P('耳垂緊貼','Attached'),img:['ear_free.png','ear_attached.png'],crop:[0,0,1,1],spots:[[[.47,.86]],[[.46,.79]]],
  text:P('依課本：耳垂分離是顯性，耳垂緊貼是隱性。補充：真實的耳垂從完全分離到完全緊貼有很多中間型，研究發現和很多個基因有關。','In the textbook model, free earlobes are dominant and attached ones recessive. Extra: real earlobes range smoothly from free to attached, and studies link them to many genes.')},
 {id:'tongue',name:P('捲舌','Tongue rolling'),dom:P('能捲舌','Roller'),rec:P('不能捲舌','Non-roller'),img:['tongue_roll.png','tongue_flat.png'],crop:[0,0,1,1],spots:[[[.5,.43]],[[.5,.62]]],
  text:P('依課本：能捲舌是顯性，不能捲舌是隱性。補充：科學家發現有同卵雙胞胎一個會捲、一個不會，也有人練習後學會，所以它不是單純由一對基因決定。','In the textbook model, tongue rolling is dominant and non-rolling recessive. Extra: some identical twins differ (one can roll, one cannot) and some people learn it by practising, so it is not set by one gene pair alone.')},
 {id:'dimple',name:P('酒窩','Dimples'),dom:P('有酒窩','Dimples'),rec:P('無酒窩','None'),img:['dimples_yes.png','dimples_no.png'],crop:[0,0,1,1],spots:[[[.15,.46],[.85,.46]],[[.15,.46],[.85,.46]]],
  text:P('依課本：有酒窩是顯性，無酒窩是隱性。補充：有人只有一邊有酒窩，酒窩也可能隨年齡出現或變淡；目前還沒有足夠的研究證明它由一對基因決定。','In the textbook model, dimples are dominant and no dimples recessive. Extra: some people have a dimple on one side only, and dimples can appear or fade with age; there is not enough research to show one gene pair decides them.')},
 {id:'peak',name:P('美人尖','Widow\'s peak'),dom:P('有美人尖','Peak'),rec:P('無美人尖','Straight'),img:['hairline_peak.png','hairline_straight.png'],crop:[0,0,1,1],spots:[[[.5,.46]],[[.5,.43]]],
  text:P('依課本：有美人尖是顯性，無美人尖是隱性。補充：髮際線會隨年齡往後退，形狀也不只兩種；目前還沒有足夠的研究證明它由一對基因決定。','In the textbook model, a widow\'s peak is dominant and a straight hairline recessive. Extra: hairlines move back with age and come in more than two shapes; there is not enough research to show one gene pair decides them.')}
];
function face(c,q,dom,bx,by,bw,bh,t,{mark=false,alpha=1}={}){
  const i=dom?0:1,r=place(c,q.img[i],bx,by,bw,bh,{crop:q.crop,alpha});
  if(!r){c.save();c.globalAlpha=alpha;D.round(c,bx,by,bw,bh,10,null,C.edge);text(c,dom?q.dom:q.rec,bx+bw/2,by+bh/2+8,22,C.muted,'center');c.restore();return null;}
  if(mark)q.spots[i].forEach(([fx,fy],j)=>pulse(c,r.x+fx*r.w,r.y+fy*r.h,t+j*.35,dom?C.green:C.orange,Math.max(9,r.w*.05)));
  return r;
}
function formLine(c,q,x,y){let xx=x;text(c,q.dom,xx,y,22,C.green);xx+=measure(c,q.dom,22)+4;text(c,'／',xx,y,22,C.muted);xx+=measure(c,'／',22)+4;text(c,q.rec,xx,y,22,C.orange);}
function drawTraitTable(c,s){
  panel(c,20,20,300,560);
  text(c,P('課本裡的人類性狀','Human traits (textbook)'),36,52,22,C.yellow);
  let x=36;const dl=P('顯性','Dominant'),rl=P('隱性','Recessive');text(c,dl,x,84,22,C.green);x+=measure(c,dl,22)+4;text(c,'／',x,84,22,C.muted);x+=measure(c,'／',22)+4;text(c,rl,x,84,22,C.orange);
  TRAITS.forEach((q,i)=>{const y=98+i*64,on=i===s.trait;
    D.round(c,30,y,280,58,10,on?rgba(C.yellow,.18):'rgba(11,26,21,.45)',on?C.yellow:C.edge);
    text(c,q.name,44,y+25,22,on?C.yellow:C.white);formLine(c,q,44,y+51);D.hit(30,y,280,58,'trait',i);});
  D.round(c,30,420,280,156,12,'rgba(85,233,255,.08)',rgba(C.cyan,.65));
  text(c,P('補充：不一定那麼簡單','Extra: not that simple'),44,450,22,C.cyan);
  wrap(c,P('課本用一對基因來練習；真實的人常受多個基因和環境影響。','The textbook uses one gene pair; real traits often involve many genes.'),44,482,252,22,C.white,28);
}
function drawCompare(c,s,t){
  const q=TRAITS[s.trait],since=t-(s.since||0),X=[490,790],g=ease(since/1.1);
  panel(c,340,20,600,560);
  const head=P(`性狀：${q.name[0]}`,`Trait: ${q.name[1]}`),hw=measure(c,head,24)+28,top=pill(c,head,640-hw/2,30,{active:true,color:C.yellow,size:24});
  const y0=top.y+top.h,yb=y0+20;
  X.forEach((x,i)=>{const dom=i===0,col=dom?C.green:C.orange;
    const br=[[640,y0],[640,yb],[x,yb],[x,126]];sline(c,br.slice(0,2+Math.round(g*2)),col,3);
    c.save();c.globalAlpha=clamp((g-.5)/.5);const f=dom?P(`顯性：${q.dom[0]}`,`Dominant: ${q.dom[1]}`):P(`隱性：${q.rec[0]}`,`Recessive: ${q.rec[1]}`),fw=measure(c,f,22)+28;pill(c,f,x-fw/2,126,{color:col});c.restore();
    D.round(c,x-136,182,272,276,14,'rgba(11,26,21,.55)',rgba(col,.55));
    face(c,q,dom,x-126,192,252,256,t,{mark:g>=1});
    if(dom){pairChips(c,x-78,500,[['A',PLAIN],['A',PLAIN]],32);text(c,P('或','or'),x,508,22,C.muted,'center');pairChips(c,x+78,500,[['A',PLAIN],['a',PLAIN]],32);}
    else pairChips(c,x,500,[['a',PLAIN],['a',PLAIN]],32);
  });
  text(c,P('有一個 A 就表現顯性；兩個都是 a 才表現隱性。','One A: dominant form. Only aa: recessive form.'),640,560,22,C.muted,'center');
}
const FAM_NAMES=[P('爸媽都是 Aa','Parents: Aa × Aa'),P('形成配子：A、a 分開','Gametes: A and a separate'),P('精卵隨機結合','Random fertilization'),P('孩子的四種可能','Four possible children')];
const FAM_SHORT=[P('爸媽','Parents'),P('形成配子','Gametes'),P('受精','Fertilization'),P('孩子','Children')];
const KIDS=[['A','A'],['A','a'],['a','A'],['a','a']]; // [from sperm, from egg]
const PAR=[{x:352,label:P('爸爸','Father'),col:SPERM,gx:[462,570]},{x:648,label:P('媽媽','Mother'),col:EGG,gx:[748,858]}];
const KX=[415,565,715,865],GY=216,KY=256;
function drawFamily(c,s,t){
  const q=TRAITS[s.trait],{k,u,held}=stageClock(s,t,4,5);s.shown=k;
  panel(c,340,20,600,560);
  PAR.forEach(p=>{D.round(c,p.x,32,280,148,14,'rgba(11,26,21,.55)',rgba(p.col,.7));
    face(c,q,true,p.x+10,40,152,132,t,{alpha:k>=2?.55:1});
    text(c,p.label,p.x+222,66,22,p.col,'center');
    c.save();c.globalAlpha=k>=1?.35:1;chip(c,p.x+204,110,'A',PLAIN,32);chip(c,p.x+240,110,'a',PLAIN,32);c.restore();
    text(c,q.dom,p.x+222,160,22,C.green,'center');});
  if(k>=1){text(c,P('精子','Sperm'),PAR[0].gx[0]-32,GY+8,22,SPERM,'right');text(c,P('卵','Eggs'),PAR[1].gx[0]-32,GY+8,22,EGG,'right');}
  // gametes
  if(k===0){PAR.forEach((p,j)=>pulse(c,p.x+222,110,t+j*.6,p.col,30));dashed(c,420,GY-26,480,52,P('形成配子時，A 和 a 會怎樣？','What happens to A and a?'));}
  else PAR.forEach(p=>['A','a'].forEach((l,j)=>{const v=k===1?ease((held?u:u*1.4)*1.25-j*.2):1,from=[p.x+204+j*36,110],to=[p.gx[j],GY];
    if(v<1){line(c,[from,[mix(from[0],to[0],v),mix(from[1],to[1],v)]],rgba(p.col,.35),2);chip(c,mix(from[0],to[0],v),mix(from[1],to[1],v),l,p.col,30);}else gamete(c,to[0],to[1],l,p.col,24);}));
  // children
  const g2=k===2?(held?u:clamp(u*1.3)):k>2?1:0,g3=k===3?(held?u:clamp(u*1.5)):0;
  KX.forEach((x,i)=>{const [fs,fe]=KIDS[i],rec=fs==='a'&&fe==='a';
    if(k<2){dashed(c,x-68,KY,136,264,P('？','?'));return;}
    D.round(c,x-68,KY,136,264,14,'rgba(11,26,21,.55)',k===3&&rec?rgba(C.orange,.8):C.edge);
    const v=clamp((g2*1.35-i*.18)/.5),sx=PAR[0].gx[fs==='A'?0:1],ex=PAR[1].gx[fe==='A'?0:1],dom1=fs==='A'||fe!=='A';
    const slotS=[x+(dom1?-17:17),KY+26],slotE=[x+(dom1?17:-17),KY+26];
    if(v<1){line(c,[[sx,GY+24],[mix(sx,slotS[0],v),mix(GY,slotS[1],v)]],rgba(SPERM,.35),2);line(c,[[ex,GY+24],[mix(ex,slotE[0],v),mix(GY,slotE[1],v)]],rgba(EGG,.35),2);
      if(v>0){chip(c,mix(sx,slotS[0],v),mix(GY,slotS[1],v),fs,SPERM,30);chip(c,mix(ex,slotE[0],v),mix(GY,slotE[1],v),fe,EGG,30);}}
    else pairChips(c,x,KY+26,[[fs,SPERM],[fe,EGG]],30);
    if(k===3){const a=clamp(g3*1.4-i*.12);if(rec&&a>.9)glow(c,x,KY+120,74,C.orange,.22+.08*Math.sin(t*3));
      face(c,q,!rec,x-62,KY+46,124,132,t,{alpha:a});
      c.save();c.globalAlpha=a;text(c,rec?q.rec:q.dom,x,KY+208,22,rec?C.orange:C.green,'center');text(c,'1/4',x,KY+244,22,C.muted,'center');c.restore();}
    else text(c,P('？','?'),x,KY+150,26,C.muted,'center');
  });
  if(k===3)text(c,P(`${q.dom[0]}：${q.rec[0]}＝3：1`,`${q.dom[1]} : ${q.rec[1].toLowerCase()} = 3 : 1`),640,560,24,C.yellow,'center');
  else text(c,P('精子帶的是青色，卵帶的是粉紅色。','Cyan came in the sperm, pink in the egg.'),640,560,22,C.muted,'center');
}
function drawTraits(c,s,t){drawTraitTable(c,s);if(s.view===1)drawFamily(c,s,t);else drawCompare(c,s,t);}
const famText=(q,k)=>[
  P(`爸爸、媽媽都是${q.dom[0]}，基因型都是 Aa：A 讓他們表現${q.dom[0]}，a 藏在身體裡沒有表現出來。`,`Both parents show the dominant form (${q.dom[1].toLowerCase()}) and are Aa: A sets the form, while a is carried but not shown.`),
  P('形成精子和卵時，成對的 A 和 a 分開：每個精子、每個卵只帶一個，帶 A 或帶 a 的機率各一半。','When sperm and eggs form, the pair separates: each sperm or egg carries one allele, A or a, half and half.'),
  P('精子和卵隨機結合，有四種機率相同的組合：AA、Aa、aA、aa。','Sperm and egg meet at random, giving four equally likely combinations: AA, Aa, aA and aa.'),
  P(`只有 aa 的孩子表現${q.rec[0]}，機率 1/4；AA 和 Aa 都是${q.dom[0]}，機率 3/4。所以兩個${q.dom[0]}的爸媽，也可能生出${q.rec[0]}的孩子。`,`Only an aa child shows the recessive form (${q.rec[1].toLowerCase()}), with chance 1/4; AA and Aa show the dominant form, 3/4. So two parents with the dominant form can have a child with the recessive form.`)][k];

// ── Tab 2: ABO blood groups ────────────────────────────────────────────────
const ABO=['AA','Ai','BB','Bi','AB','ii'];
const AB_NAMES=[P('親代','Parents'),P('分離成配子','Alleles separate'),P('配子結合','Gametes combine'),P('看結果','Results')];
const AB_SHORT=[P('親代','Parents'),P('分離','Separate'),P('結合','Combine'),P('結果','Results')];
const AB_TEXT=[
 P('先寫出爸爸、媽媽的基因型。A 型可能是 IᴬIᴬ 或 Iᴬi，B 型可能是 IᴮIᴮ 或 Iᴮi；只看血型，不一定知道基因型。','Write each parent\'s genotype. Type A can be IᴬIᴬ or Iᴬi and type B can be IᴮIᴮ or Iᴮi; a blood type alone does not always tell the genotype.'),
 P('形成精子和卵時，成對的等位基因分開，每個配子只帶一個。Iᴬi 產生帶 Iᴬ、帶 i 的配子，機率各一半。','When sperm and eggs form, the pair separates and each gamete carries one allele. Iᴬi makes Iᴬ and i gametes, half each.'),
 P('精子和卵隨機結合。上方的精子往下、左方的卵往右，交叉的那一格就是一種組合。','Sperm and egg meet at random. A sperm on top moves down and an egg on the side moves across; each cell is one combination.'),
 P('四格的機率一樣，各是 1/4。Iᴬ 和 Iᴮ 在一起時兩個都表現，是 AB 型；只有 ii 才是 O 型。','Each cell has chance 1/4. Iᴬ with Iᴮ shows both: type AB. Only ii is type O.')
];
const ACOL=[655,835],AROW=[250,410],AGX=565,AGY=170,ACW=180,ACH=160,ATOP=145,ASIDE=532;
function drawAboKey(c,hi){
  panel(c,20,20,300,560);
  text(c,P('ABO 血型的基因','ABO blood group genes'),36,52,22,C.yellow);
  abChip(c,58,90,'A',PLAIN,34);abChip(c,108,90,'B',PLAIN,34);abChip(c,150,90,'i',PLAIN,34);
  text(c,P('三種等位基因','three alleles'),178,98,22,C.white);
  text(c,P('每個人只有其中兩個。','Each person has two.'),36,140,22,C.muted);
  rich(c,[T(P('顯性：','Dominant: ')),AL('A'),T(P('、',', ')),AL('B'),T(' > '),AL('i')],36,178,22);
  rich(c,[AL('A'),T(P(' 和 ',' with ')),AL('B'),T(P('：兩個都表現',': both show'))],36,214,22);
  text(c,P('血型','Type'),44,254,22,C.muted);text(c,P('基因型','Genotypes'),160,254,22,C.muted);
  const rows=[['A',['AA','Ai']],['B',['BB','Bi']],['AB',['AB']],['O',['ii']]];
  rows.forEach(([ty,gs],i)=>{const y=266+i*60,on=hi.has(ty),col=TYPE_COL[ty];
    D.round(c,30,y,280,52,10,on?rgba(col,.16):'rgba(11,26,21,.45)',on?col:C.edge);
    drop(c,52,y+32,11,null);text(c,tname(ty),70,y+34,22,col);
    const toks=[];gs.forEach((g,j)=>{if(j)toks.push(T(P('、',', ')));toks.push(...genoTok(g));});rich(c,toks,160,y+34,22,C.white);});
  text(c,P('6 種基因型 → 4 種血型','6 genotypes → 4 types'),36,534,22,C.muted);
}
function drawAbo(c,s,t){
  const {k,u,held}=stageClock(s,t,4,4.8);s.shown=k;
  const sp=[...s.pa].sort(alSort),eg=[...s.pb].sort(alSort);
  const cells=[0,1,2,3].map(i=>{const r=i>>1,cc=i&1;return{r,cc,sp:sp[cc],eg:eg[r],type:typeOf(sp[cc]+eg[r])};});
  drawAboKey(c,new Set(k>=3?cells.map(q=>q.type):[typeOf(s.pa),typeOf(s.pb)]));
  panel(c,340,20,600,560);
  stepList(c,AB_SHORT,k,360,58);
  // father (sperm) on top, mother (egg) on the left
  D.round(c,565,30,360,90,14,'rgba(11,26,21,.55)',rgba(SPERM,.7));
  text(c,P('爸爸（精子）','Father (sperm)'),581,62,22,SPERM);drop(c,598,100,12,null);text(c,tname(typeOf(s.pa)),618,106,22,TYPE_COL[typeOf(s.pa)]);
  c.save();c.globalAlpha=k>=1?.35:1;abChip(c,836,75,sp[0],PLAIN,34);abChip(c,884,75,sp[1],PLAIN,34);c.restore();
  D.round(c,352,200,150,320,14,'rgba(11,26,21,.55)',rgba(EGG,.7));
  text(c,P('媽媽','Mother'),427,234,22,EGG,'center');text(c,P('（卵）','(egg)'),427,262,22,EGG,'center');
  {const tn=tname(typeOf(s.pb)),w=measure(c,tn,22)+26,x0=427-w/2;drop(c,x0+10,346,12,null);text(c,tn,x0+26,352,22,TYPE_COL[typeOf(s.pb)]);}
  c.save();c.globalAlpha=k>=1?.35:1;abChip(c,403,450,eg[0],PLAIN,34);abChip(c,451,450,eg[1],PLAIN,34);c.restore();
  // cells
  cells.forEach((q,i)=>{const x=AGX+q.cc*ACW,y=AGY+q.r*ACH,on=s.cell===i&&k>=2;
    c.save();if(k<2)c.setLineDash([8,6]);D.round(c,x+5,y+5,ACW-10,ACH-10,14,on?rgba(C.yellow,.16):'rgba(11,26,21,.55)',on?C.yellow:C.edge);c.restore();
    if(k>=2)D.hit(x+5,y+5,ACW-10,ACH-10,'cell',i);});
  // gametes
  const g1=k===1?(held?u:clamp(u*1.4)):1;
  if(k>=1)[0,1].forEach(j=>{const v=k===1?ease(g1*1.3-(1-j)*.2):1;
    const ps=[836+j*48,75],pd=[ACOL[j],ATOP],es=[403+j*48,450],ed=[ASIDE,AROW[j]];
    if(v<1){abChip(c,mix(ps[0],pd[0],v),mix(ps[1],pd[1],v),sp[j],SPERM,34);abChip(c,mix(es[0],ed[0],v),mix(es[1],ed[1],v),eg[j],EGG,34);}
    else{abGamete(c,pd[0],pd[1],sp[j],SPERM,24);abGamete(c,ed[0],ed[1],eg[j],EGG,24);}});
  if(k===0){pulse(c,860,75,t,C.cyan,40);pulse(c,427,450,t+.6,C.pink,40);D.round(c,592,296,306,76,12,'rgba(11,26,21,.92)',C.edge);text(c,P('先選爸媽的基因型，','Choose the genotypes,'),745,326,22,C.muted,'center');text(c,P('再按「連續播放」。','then press Play all.'),745,356,22,C.muted,'center');}
  // combine
  if(k>=2)cells.forEach((q,i)=>{const cx=ACOL[q.cc],cy=AROW[q.r],v=k===2?ease(((held?u:u*1.25)-.05-i*.2)/.3):1;if(v<=0)return;
    const spFirst=alSort(q.sp,q.eg)<=0,xs=cx+(spFirst?-25:25),xe=cx+(spFirst?25:-25),yy=cy-48;
    if(v<1){abChip(c,mix(cx,xs,v),mix(ATOP,yy,v),q.sp,SPERM,34);abChip(c,mix(ASIDE,xe,v),mix(cy,yy,v),q.eg,EGG,34);}
    else{abChip(c,xs,yy,q.sp,SPERM,34);abChip(c,xe,yy,q.eg,EGG,34);}
    if(s.cell===i){pulse(c,cx,ATOP,t,C.yellow,28);pulse(c,ASIDE,cy,t,C.yellow,28);}});
  if(k>=3){const g=held?u:clamp(u*1.3);cells.forEach((q,i)=>{const cx=ACOL[q.cc],cy=AROW[q.r],a=clamp(g*1.4-i*.12);
    c.save();c.globalAlpha=a;drop(c,cx-30,cy+34,22,q.type);text(c,tname(q.type),cx+40,cy+24,22,TYPE_COL[q.type],'center');text(c,'1/4',cx+40,cy+56,22,C.muted,'center');c.restore();});}
  // summary
  if(k>=3){const gc={},tc={};cells.forEach(q=>{const g=[q.sp,q.eg].sort(alSort).join('');gc[g]=(gc[g]||0)+1;tc[q.type]=(tc[q.type]||0)+1;});
    const gs=ABO.filter(g=>gc[g]),ts=TYPES.filter(x=>tc[x]),toks=[T(P('基因型　','Genotypes  '))];
    gs.forEach((g,j)=>{if(j)toks.push(T(P('：',' : ')));toks.push(...genoTok(g));});
    if(gs.length>1)toks.push(T(P(`＝${ratio(gs.map(g=>gc[g]))}`,` = ${enRatio(ratio(gs.map(g=>gc[g])))}`)));else toks.push(T(P('　全部一樣','  all the same')));
    rich(c,toks,360,536,22,C.white);
    text(c,ts.length>1?P(`血型　${ts.join('：')}＝${ratio(ts.map(x=>tc[x]))}`,`Types ${ts.join(' : ')} = ${enRatio(ratio(ts.map(x=>tc[x])))}`):P(`血型　全部 ${ts[0]} 型`,`All type ${ts[0]}`),360,568,22,C.yellow);
  }else text(c,P('基因型？　血型？','Genotypes? Blood types?'),360,552,22,C.muted);
}

// ── Tab 3: the textbook's token-drawing activity ───────────────────────────
const EMPTY=()=>({A:0,B:0,AB:0,O:0});
function oneDraw(){const pa=Math.random()<.5?'A':'i',pb=Math.random()<.5?'B':'i';return{pa,pb,type:typeOf(pa+pb)};}
function mineShown(s,t){const shown=s.batch.length?Math.min(s.batch.length,Math.floor((t-s.animStart)/s.dt)+1):0;return{list:s.mine.concat(s.batch.slice(0,shown)),shown};}
function tally(list){const o=EMPTY();list.forEach(r=>o[r.type]++);return o;}
function cup(c,x,y,col,label,tokens,taken){
  text(c,label,x,y-92,22,col,'center');
  c.save();c.beginPath();c.moveTo(x-58,y-70);c.lineTo(x+58,y-70);c.lineTo(x+44,y+52);c.lineTo(x-44,y+52);c.closePath();
  const g=c.createLinearGradient(x-58,0,x+58,0);g.addColorStop(0,rgba(col,.10));g.addColorStop(.5,rgba(col,.22));g.addColorStop(1,rgba(col,.10));c.fillStyle=g;c.fill();c.strokeStyle=col;c.lineWidth=3;c.stroke();c.restore();
  ellipse(c,x,y-70,58,10,null,col,3);
  tokens.forEach((al,j)=>{const tx=x+(j?23:-23),ty=y+16;c.save();c.globalAlpha=taken===j?.25:1;circle(c,tx,ty,21,'#16332b',col,3);alleleGlyph(c,al,tx,ty,22,C.white);c.restore();});
}
function bars(c,x0,title,counts,n,grow=1,placeholder=null){
  const W=262,H=180,base=468,bw=46,gap=(W-4*bw)/3,max=.6;
  text(c,title,x0+W/2,248,22,C.white,'center');
  line(c,[[x0,base],[x0+W,base]],C.edge,2);
  const yq=base-H*(.25/max);c.save();c.setLineDash([6,5]);line(c,[[x0-4,yq],[x0+W+4,yq]],C.yellow,2.5);c.restore();
  if(placeholder){text(c,placeholder,x0+W/2,base-118,22,C.muted,'center');}
  TYPES.forEach((ty,i)=>{const x=x0+i*(bw+gap),col=TYPE_COL[ty],p=n?counts[ty]/n:0,h=H*Math.min(p,max)/max*grow;
    if(n&&!placeholder){D.round(c,x,base-Math.max(h,2),bw,Math.max(h,2),6,rgba(col,.85));if(p>max)text(c,'↑',x+bw/2,base-H-6,22,col,'center');}
    text(c,ty,x+bw/2,base+28,22,col,'center');text(c,n&&!placeholder?`${Math.round(p*100)}%`:'–',x+bw/2,base+58,22,C.white,'center');});
}
function drawTokens(c,s,t){
  const {list,shown}=mineShown(s,t),last=shown?s.batch[shown-1]:null,n=list.length,mine=tally(list);
  panel(c,20,20,300,560);
  text(c,P('抽棋子模擬血型遺傳','Token model of ABO'),36,52,22,C.yellow);
  const v=last?(s.dt>=.2?ease((t-s.animStart-(shown-1)*s.dt)/Math.min(.5,s.dt)):1):0,held=last&&v<1;
  cup(c,98,216,SPERM,P('爸爸 A 型','Father, A'),['A','i'],held?(last.pa==='A'?0:1):-1);
  cup(c,242,216,EGG,P('媽媽 B 型','Mother, B'),['B','i'],held?(last.pb==='B'?0:1):-1);
  rich(c,genoTok('Ai'),98,302,22,C.muted,'center');rich(c,genoTok('Bi'),242,302,22,C.muted,'center');
  if(last){const from=[[98+(last.pa==='A'?-23:23),232],[242+(last.pb==='B'?-23:23),232]],to=[[146,356],[194,356]];
    const k=Math.min(1,v*1.6);[[last.pa,SPERM],[last.pb,EGG]].forEach(([al,col],j)=>{const x=mix(from[j][0],to[j][0],k),y=mix(from[j][1],to[j][1],k);circle(c,x,y,21,'#16332b',col,3);alleleGlyph(c,al,x,y,22,C.white);});
    if(v>=.6){c.save();c.globalAlpha=clamp((v-.6)/.4);drop(c,170,446,26,last.type);text(c,tname(last.type),170,500,24,TYPE_COL[last.type],'center');c.restore();}}
  else text(c,P('按「抽 1 次」開始','Press "Draw 1"'),170,420,22,C.muted,'center');
  wrap(c,P('每次各抽一枚，記下血型，再放回杯子。','Draw one from each cup, record, put back.'),36,532,268,22,C.muted,28);
  panel(c,340,20,600,560);
  text(c,P(`我的紀錄（最近 30 次，共 ${n} 次）`,`My draws (latest 30 of ${n})`),356,52,22,C.white);
  const recent=list.slice(-30);for(let i=0;i<30;i++){const r=Math.floor(i/10),cc=i%10,x=356+cc*57,y=66+r*46,q=recent[i];
    D.round(c,x,y,51,38,8,q?rgba(TYPE_COL[q.type],.18):'rgba(11,26,21,.4)',q?rgba(TYPE_COL[q.type],.8):C.edge);if(q)text(c,q.type,x+25.5,y+27,22,TYPE_COL[q.type],'center');}
  const cg=clamp((t-s.mergeStart)/1.4),others=s.others,on=others.n,cls=EMPTY();TYPES.forEach(ty=>cls[ty]=mine[ty]+others[ty]*ease(cg));
  bars(c,362,P(`我自己：${n} 次`,`Me: ${n} draws`),mine,n,1,n?null:P('還沒抽','No draws yet'));
  bars(c,662,on?P(`全班合併：${n+Math.round(on*ease(cg))} 次`,`Whole class: ${n+Math.round(on*ease(cg))}`):P('全班合併','Whole class'),cls,n+on*ease(cg),1,on?null:P('按「加入全班」','Press "Add class"'));
  text(c,P('黃色虛線＝預期每種 25%','Yellow line = expected 25% each'),640,568,22,C.muted,'center');
}
function addDraws(s,count){for(const q of s.batch)s.mine.push(q);s.batch=[];for(let i=0;i<count;i++)s.batch.push(oneDraw());s.dt=count===1?.7:.26;s.animStart=s.elapsed;}

// ── Tab 4: chromosomes and boy or girl ─────────────────────────────────────
// Human chromosome sizes (million base pairs, GRCh38) and centromere position (fraction from the top).
const CHR=[[249,.5],[242,.39],[198,.46],[190,.26],[182,.27],[171,.35],[159,.38],[145,.31],[138,.32],[134,.3],[135,.39],[133,.27],[114,.15],[107,.16],[102,.17],[90,.4],[83,.29],[80,.22],[59,.45],[64,.43],[47,.25],[51,.27]];
const XC=[156,.39],YC=[57,.18],KS=.4;
function rod(c,x,y,L,cen,color,{w=10,rot=0,alpha=1,seed=1}={}){
  if(alpha<=0)return;c.save();c.translate(x,y);c.rotate(rot);c.globalAlpha=alpha;
  const up=Math.max(3,L*cen),dn=Math.max(3,L-up),r=w/2;c.fillStyle=color;c.strokeStyle=C.ink;c.lineWidth=1.6;
  c.beginPath();c.roundRect(-r,-up,w,up-1,r);c.fill();c.stroke();c.beginPath();c.roundRect(-r,1,w,dn-1,r);c.fill();c.stroke();
  c.fillStyle='rgba(11,26,21,.38)';const R=rng(seed*7919);for(let i=0;i<Math.round(L/12);i++){const yy=-up+3+R()*(L-6);if(Math.abs(yy)>3)c.fillRect(-r+1.5,yy,w-3,1.8+R()*1.6);}
  c.restore();
}
const sexPair=sex=>sex==='M'?[[YC,SPERM,'Y'],[XC,EGG,'X']]:[[XC,SPERM,'X'],[XC,EGG,'X']];
// Karyotype layout: rows 1–5, 6–12, 13–18, 19–22 + the sex pair; centromeres aligned on each row.
const KROWS=[[0,5],[5,12],[12,18],[18,23]];
function karyo(sex){
  const out=[];let top=70;
  KROWS.forEach(([a,b],r)=>{const ids=[];for(let i=a;i<b;i++)ids.push(i);
    const spec=i=>i<22?CHR[i]:XC,ups=ids.map(i=>spec(i)[0]*KS*spec(i)[1]),dns=ids.map(i=>spec(i)[0]*KS*(1-spec(i)[1]));
    if(r===3){ups.push(YC[0]*KS*YC[1]);dns.push(YC[0]*KS*(1-YC[1]));}
    const cy=top+Math.max(...ups),bottom=cy+Math.max(...dns),n=ids.length,step=74,extra=r===3?36:0,x0=640-((n-1)*step+extra)/2;
    ids.forEach((i,j)=>{const x=x0+j*step+(i===22?extra:0);
      if(i<22){out.push({i,which:0,x:x-8,y:cy,L:CHR[i][0]*KS,cen:CHR[i][1],col:SPERM,label:String(i+1),lx:x,ly:bottom+26});out.push({i,which:1,x:x+8,y:cy,L:CHR[i][0]*KS,cen:CHR[i][1],col:EGG});}
      else{const [[s1,c1,n1],[s2,c2,n2]]=sexPair(sex);out.push({i,which:0,x:x-8,y:cy,L:s1[0]*KS,cen:s1[1],col:c1,label:sex==='M'?'XY':'XX',lx:x,ly:bottom+26,sexLetter:n1});out.push({i,which:1,x:x+8,y:cy,L:s2[0]*KS,cen:s2[1],col:c2,sexLetter:n2});}});
    top=bottom+44;});
  return out;
}
const SCATTER=(()=>{const R=rng(46),o=[];for(let k=0;k<46;k++){const a=R()*TAU,d=Math.sqrt(R())*190;o.push({x:640+Math.cos(a)*d*1.25,y:296+Math.sin(a)*d,rot:(R()-.5)*3});}return o;})();
const SEX_NAMES=[P('體細胞：23 對染色體','Body cell: 23 pairs'),P('形成配子：每對分開','Gametes: each pair separates'),P('受精：卵遇上 X 或 Y','Fertilization: X meets X or Y'),P('每一胎都重新開始','Every child is a new draw')];
const SEX_SHORT=[P('23 對','23 pairs'),P('配子','Gametes'),P('受精','Fertilization'),P('每一胎','Each child')];
function drawSexKey(c,k){
  panel(c,20,20,300,560);
  text(c,P('人的染色體','Human chromosomes'),36,52,22,C.yellow);
  text(c,P('體細胞 46 條＝23 對','Body cell: 46 = 23 pairs'),36,92,24,C.white);
  rod(c,48,138,30,.4,SPERM,{seed:3});text(c,P('來自爸爸（精子）','from Father (sperm)'),66,146,22,SPERM);
  rod(c,48,182,30,.4,EGG,{seed:5});text(c,P('來自媽媽（卵）','from Mother (egg)'),66,190,22,EGG);
  D.round(c,30,214,280,92,10,'rgba(11,26,21,.45)',C.edge);
  text(c,P('第 1～22 對','Pairs 1–22: autosomes'),44,244,22,C.white);text(c,P('體染色體，男女都一樣','same in both sexes'),44,278,22,C.muted);
  D.round(c,30,316,280,112,10,'rgba(253,224,71,.1)',rgba(C.yellow,.7));
  const h23=wrap(c,P('第 23 對：性染色體','Pair 23: sex chromosomes'),44,346,252,22,C.yellow,28);text(c,P('女生 XX　男生 XY','Female XX, male XY'),44,346+h23+(h23>28?6:10),22,C.white);
  if(h23<=28)text(c,P('Y 比 X 小很多','Y is much smaller than X'),44,414,22,C.muted); // English: the two-line title leaves no room; the caption says it
  D.round(c,30,438,280,138,10,k>=1?'rgba(85,233,255,.08)':'rgba(11,26,21,.45)',k>=1?rgba(C.cyan,.6):C.edge);
  text(c,P('配子只有 23 條','Gametes have 23'),44,468,22,C.white);
  text(c,P('精子：22＋X 或 22＋Y','Sperm: 22+X or 22+Y'),44,504,22,SPERM);text(c,P('卵：22＋X','Egg: 22+X'),44,540,22,EGG);
}
function drawKaryo(c,s,t,tau){
  const K=karyo(s.sex),sorted=K.map((q,j)=>({q,p:ease(clamp((tau-1.4-j*.03)/1.6))})),all=sorted.every(o=>o.p>=1),done=clamp((tau-4.6)/.6);
  // nucleus outline while scattered
  c.save();c.globalAlpha=1-clamp((tau-1.2)/1.6);ellipse(c,640,296,262,206,'rgba(85,233,255,.05)',rgba(C.cyan,.45),2.5);c.restore();
  sorted.forEach(({q,p},j)=>{const sc=SCATTER[j],x=mix(sc.x,q.x,p),y=mix(sc.y,q.y,p),rot=mix(sc.rot+Math.sin(t*.7+j)*.08*(1-p),0,p);rod(c,x,y,q.L,q.cen,q.col,{rot,seed:q.i*2+q.which+1});});
  if(done>0){c.save();c.globalAlpha=done;K.filter(q=>q.label).forEach(q=>text(c,q.label,q.lx,q.ly,22,q.i===22?C.yellow:C.muted,'center'));
    const sx=K.find(q=>q.i===22),bt=sx.y-XC[0]*KS*XC[1]-6;D.round(c,sx.lx-32,bt,64,sx.ly+10-bt,10,null,C.yellow);c.restore();}
  text(c,all?P(`排成 23 對：${s.sex==='M'?'男生 44＋XY':'女生 44＋XX'}`,`Sorted into 23 pairs: ${s.sex==='M'?'male 44+XY':'female 44+XX'}`):P('細胞核裡的 46 條染色體','46 chromosomes in a nucleus'),640,56,22,all?C.yellow:C.white,'center');
}
function cellWithSet(c,x,y,r,sexSet,label,alpha=1,splitV=0){
  c.save();c.globalAlpha=alpha;circle(c,x,y,r,'rgba(85,233,255,.05)',C.edge,3);
  for(let i=0;i<44;i++){const row=Math.floor(i/11),cc=i%11,L=8+((i*7)%11);rod(c,x-55+cc*11,y-46+row*19,L,.4,'#c8d6cc',{w:4,seed:i+3});}
  sexSet.forEach(([spec,col],j)=>rod(c,x+(j?16:-16)+(j?1:-1)*splitV*30,y+46,spec[0]*.26,spec[1],col,{w:9,seed:j+90}));
  c.restore();text(c,label,x,y+r+30,24,C.white,'center',MONO);
}
function sperm(c,x,y,letterSpec,t,alpha=1){c.save();c.globalAlpha=alpha;
  const pts=[];for(let i=0;i<=24;i++){const u=i/24;pts.push([x+44+u*96,y+Math.sin(u*8-t*8)*7*u]);}sline(c,pts,rgba(SPERM,.85),3);
  ellipse(c,x,y,46,38,'rgba(85,233,255,.14)',SPERM,3);rod(c,x,y,letterSpec[0]*GS,letterSpec[1],SPERM,{w:11,seed:letterSpec===YC?7:8});c.restore();}
const GS=.4; // gamete-scale chromosome size (px per Mb), X ≈ 62 px, Y ≈ 23 px
function egg(c,x,y,r,alpha=1){c.save();c.globalAlpha=alpha;circle(c,x,y,r,'rgba(244,114,182,.12)',EGG,3);rod(c,x,y,XC[0]*GS,XC[1],EGG,{w:11,seed:9});c.restore();}
function drawGametes(c,s,t,u,held){
  const g=held?u:clamp(u*1.4),a=clamp(g*2-.4);
  text(c,P('爸爸的體細胞','Father\'s body cell'),452,54,22,C.white,'center');
  cellWithSet(c,452,150,82,[[XC,C.white],[YC,C.white]],'44＋XY',1,g);
  arrow(c,548,128,mix(548,598,clamp(g*2)),mix(128,104,clamp(g*2)),SPERM);arrow(c,548,170,mix(548,598,clamp(g*2)),mix(170,206,clamp(g*2)),SPERM);
  sperm(c,650,100,XC,t,a);sperm(c,650,210,YC,t,a);
  c.save();c.globalAlpha=a;text(c,'22＋X',800,108,24,SPERM,'left',MONO);text(c,'22＋Y',800,218,24,SPERM,'left',MONO);text(c,P('各 1/2','1/2 each'),800,160,22,C.muted);c.restore();
  line(c,[[360,292],[920,292]],rgba(C.muted,.35),2);
  text(c,P('媽媽的體細胞','Mother\'s body cell'),452,330,22,C.white,'center');
  cellWithSet(c,452,426,82,[[XC,C.white],[XC,C.white]],'44＋XX',1,g);
  arrow(c,548,426,mix(548,612,clamp(g*2)),426,EGG);
  egg(c,690,426,66,a);
  c.save();c.globalAlpha=a;text(c,'22＋X',780,434,24,EGG,'left',MONO);text(c,P('只有一種','one kind'),780,470,22,C.muted);c.restore();
}
function drawFert(c,s,t,u,held){
  const g=held?u:clamp(u*1.3),cols=[655,835];
  text(c,P('精子','Sperm'),548,112,22,SPERM,'right');
  [[XC,'22＋X'],[YC,'22＋Y']].forEach(([spec,lab],j)=>{circle(c,cols[j],100,40,'rgba(85,233,255,.12)',SPERM,3);rod(c,cols[j],100,spec[0]*GS,spec[1],SPERM,{w:11,seed:j+20});text(c,lab,cols[j],168,22,SPERM,'center',MONO);});
  text(c,P('卵','Egg'),470,232,22,EGG,'center');circle(c,470,300,40,'rgba(244,114,182,.12)',EGG,3);rod(c,470,300,XC[0]*GS,XC[1],EGG,{w:11,seed:30});text(c,'22＋X',470,368,22,EGG,'center',MONO);
  [0,1].forEach(j=>{const x=565+j*180,y=190,boy=j===1,v=clamp((g*1.4-j*.25)/.6);
    D.round(c,x+5,y+5,170,226,14,'rgba(11,26,21,.55)',v>=1?C.yellow:C.edge);
    const sx=mix(cols[j],cols[j]+16,v),sy=mix(100,256,v),ex=mix(470,cols[j]-16,v),ey=mix(300,256,v);
    if(v>0){rod(c,ex,ey,XC[0]*GS,XC[1],EGG,{w:11,seed:31});rod(c,sx,sy,(boy?YC:XC)[0]*GS,(boy?YC:XC)[1],SPERM,{w:11,seed:boy?21:20});}
    if(v>=1){text(c,boy?'44＋XY':'44＋XX',x+90,326,24,C.white,'center',MONO);text(c,boy?P('♂ 男生','♂ boy'):P('♀ 女生','♀ girl'),x+90,364,24,C.yellow,'center');text(c,'1/2',x+90,400,22,C.muted,'center');}});
  if(g>=1){text(c,P('生男、生女的機率各 1/2','Boy or girl: 1/2 each'),640,470,24,C.yellow,'center');wrap(c,P('卵都帶 X；是精子帶 X 還是帶 Y，決定了性別。','Every egg carries X; whether the sperm carries X or Y decides the sex.'),640,510,540,22,C.white,30,'center');}
}
function drawBirths(c,s,t,u,held){
  const g=held?u:clamp(u*1.3),xs=[470,640,810],flick=Math.floor(t*1.6)%2;
  text(c,P('一個家庭的三胎','Three children in one family'),640,62,22,C.white,'center');
  xs.forEach((x,i)=>{const a=clamp(g*1.6-i*.3);D.round(c,x-84,90,168,268,14,'rgba(11,26,21,.55)',i===2?C.yellow:C.edge);
    text(c,[P('第一胎','1st child'),P('第二胎','2nd child'),P('第三胎','3rd child')][i],x,124,22,C.white,'center');
    c.save();c.globalAlpha=a;
    if(i<2){text(c,'♀',x,218,64,C.white,'center');text(c,'44＋XX',x,268,22,C.white,'center',MONO);text(c,P('女生','girl'),x,306,22,C.yellow,'center');}
    else{text(c,flick?'♂':'♀',x,218,64,C.white,'center');text(c,'？',x,268,26,C.white,'center');text(c,P('女 1/2・男 1/2','girl/boy: 1/2'),x,306,22,C.yellow,'center');}
    c.restore();});
  if(g>=.8){text(c,P('前兩胎的結果，不會改變第三胎的機率。','The first two results do not change the third.'),640,420,24,C.yellow,'center');
    wrap(c,P('每一次受精都重新抽一次：精子帶 X 或 Y，各 1/2。','Each fertilization is a fresh draw: X or Y sperm, 1/2 each.'),640,462,540,22,C.white,30,'center');}
}
function drawSex(c,s,t){
  const {k,u,held,tau}=stageClock(s,t,4,7);s.shown=k;
  drawSexKey(c,k);panel(c,340,20,600,560);
  if(k===0)drawKaryo(c,s,t,tau);else if(k===1)drawGametes(c,s,t,u,held);else if(k===2)drawFert(c,s,t,u,held);else drawBirths(c,s,t,u,held);
}
const SEX_TEXT=s=>[
  s.sex==='M'?P('人的體細胞有 46 條染色體，可以兩兩配成 23 對；每一對中，一條來自爸爸（精子），一條來自媽媽（卵）。第 1～22 對是體染色體，男女都一樣；第 23 對是性染色體，男生是 XY，Y 比 X 小很多。','A human body cell has 46 chromosomes that pair up into 23 pairs; in each pair one came from the father (sperm) and one from the mother (egg). Pairs 1–22 are autosomes, the same in both sexes; pair 23 is the sex chromosomes, XY in a male, and Y is much smaller than X.'):P('人的體細胞有 46 條染色體，可以兩兩配成 23 對；每一對中，一條來自爸爸（精子），一條來自媽媽（卵）。第 1～22 對是體染色體，男女都一樣；第 23 對是性染色體，女生是 XX。','A human body cell has 46 chromosomes that pair up into 23 pairs; in each pair one came from the father (sperm) and one from the mother (egg). Pairs 1–22 are autosomes, the same in both sexes; pair 23 is the sex chromosomes, XX in a female.'),
  P('形成精子和卵時，成對的染色體分開，每個配子只有每對中的一條，共 23 條。爸爸的 X 和 Y 分開，所以精子有 22＋X 和 22＋Y 兩種，各占一半；媽媽的卵都是 22＋X。','When sperm and eggs form, each pair separates and a gamete gets one of each pair: 23 in all. The father\'s X and Y separate, so sperm are 22+X or 22+Y, half each; every egg is 22+X.'),
  P('卵（22＋X）遇到 22＋X 的精子，受精卵是 44＋XX，發育成女生；遇到 22＋Y 的精子，是 44＋XY，發育成男生。機率各 1/2，由精子帶 X 還是 Y 決定。','An egg (22+X) fertilized by a 22+X sperm gives 44+XX, a girl; by a 22+Y sperm, 44+XY, a boy. The chance is 1/2 each, decided by whether the sperm carries X or Y.'),
  P('每一胎都是一次新的受精。已經生了兩個女兒，第三胎是男孩的機率還是 1/2，不會因為前面的結果而改變。','Every child comes from a new fertilization. After two daughters, the chance that the third child is a boy is still 1/2; earlier results do not change it.')];

// ── tabs ───────────────────────────────────────────────────────────────────
const tabs=[
{id:'traits',title:P('單眼皮從哪來？','Where do single eyelids come from?'),sub:P('人類的遺傳性狀','Human traits'),
 hook:P('爸爸、媽媽都是雙眼皮，孩子卻是單眼皮，這可能嗎？單眼皮是從哪裡來的？','Both parents have double eyelids, yet their child has single eyelids. Is that possible? Where did the single eyelids come from?'),
 body:P('選一種性狀，比一比顯性和隱性；再切到「一家人」，看兩個顯性的爸媽怎麼生出隱性的孩子。','Pick a trait and compare its dominant and recessive forms; then switch to "A family" to see how two parents with the dominant form can have a child with the recessive form.'),
 reading:P('課本為了練習顯性、隱性，把眼皮、耳垂、捲舌、酒窩、美人尖都當成「一對等位基因」控制的性狀，考試請照這個模型作答。\n\n補充：科學家後來研究發現，真實的人沒有那麼單純。\n・捲舌：有同卵雙胞胎一個會捲、一個不會，也有人練習後學會。\n・耳垂：從完全分離到完全緊貼有很多中間型，和很多個基因有關。\n・酒窩、美人尖：有人只有一邊有酒窩；髮際線會隨年齡改變；目前都沒有足夠的研究證明由一對基因決定。\n・眼皮：有人小時候單眼皮，長大後變成雙眼皮。\n所以這些外表不能拿來判斷誰是誰的孩子。','The textbook treats eyelids, earlobes, tongue rolling, dimples and widow\'s peak as traits controlled by one pair of alleles, so you can practise dominant and recessive. Use this model in tests.\n\nExtra: later research shows real people are not that simple.\n• Tongue rolling: some identical twins differ, and some people learn it by practising.\n• Earlobes: there is a smooth range from free to attached, linked to many genes.\n• Dimples and widow\'s peak: some people have a dimple on one side only, and hairlines change with age; there is not enough research to show one gene pair decides either.\n• Eyelids: some children with single eyelids grow a crease later.\nSo these features cannot be used to tell whose child someone is.'),
 closure:P('依課本的模型，這些人類性狀由一對等位基因控制：有一個顯性的 A 就表現顯性（AA、Aa），aa 才表現隱性。所以兩個 Aa 的爸媽，也可能生出隱性的孩子，機率 1/4。','In the textbook model each of these traits is controlled by one pair of alleles: one dominant A gives the dominant form (AA or Aa), and only aa gives the recessive form. So two Aa parents can have a recessive child, with chance 1/4.'),
 quiz:[
  {q:P('依課本，耳垂分離是顯性。耳垂緊貼的人，基因型是？','In the textbook model free earlobes are dominant. What is the genotype of someone with attached earlobes?'),options:[P('AA，兩個都是顯性','AA: both dominant'),P('aa，兩個都是隱性','aa: both recessive'),P('Aa，一顯性一隱性','Aa: one of each type'),P('AA 或 Aa，有顯性','AA or Aa: has dominant')],answer:1,why:P('隱性的表徵，要兩個都是隱性等位基因（aa）才會表現。','A recessive form shows only when both alleles are recessive (aa).'),hint:P('隱性的表徵要幾個 a 才看得到？','How many a alleles does it take to see a recessive form?')},
  {q:P('爸爸、媽媽都是能捲舌的 Aa，孩子不能捲舌的機率是多少？','Both parents are Aa tongue rollers. What is the chance a child cannot roll?'),options:[P('3/4','3/4'),P('1/2','1/2'),P('1/4','1/4'),P('0','0')],answer:2,why:P('Aa × Aa 的四種組合中，只有 aa 一種不能捲舌，機率 1/4。','Of the four Aa × Aa combinations, only aa cannot roll: 1/4.'),hint:P('切到「一家人」，數一數四個孩子裡有幾個是隱性。','Switch to "A family" and count the recessive children.')},
  {q:P('小華是雙眼皮。只看外表，可以確定他的基因型嗎？','Hua has double eyelids. Can you tell his genotype just by looking?'),options:[P('可以，外表看得到所以是 AA','Yes: looks show he is AA'),P('不能，可能是 AA 或 Aa','No: he could be AA or Aa'),P('可以，外表看得到所以是 Aa','Yes: looks show he is Aa'),P('可以，雙眼皮就是基因型 aa','Yes: double eyelids mean aa')],answer:1,why:P('顯性的表徵有 AA、Aa 兩種可能，只看外表分不出來。','The dominant form can come from AA or Aa; looks alone cannot tell them apart.'),hint:P('看「比一比」顯性那張卡片下面，寫了幾種基因型？','In "Compare", how many genotypes are under the dominant card?')}
 ],
 sources:[],init:()=>({running:true,trait:0,since:0,view:0,phase:-1,start:0}),
 controls:s=>[choice(P('選一種性狀','Pick a trait'),'trait',TRAITS.map((q,i)=>[i,q.name])),choice(P('觀察','View'),'view',[[0,P('比一比','Compare')],[1,P('一家人','A family')]])].concat(s.view===1?[choice(P('步驟','Step'),'phase',[[-1,P('連續播放','Play all')],...FAM_SHORT.map((n,i)=>[i,n])])]:[]),
 act(s,k,v){s[k]=v;s.since=s.elapsed;if(k==='view'||k==='phase'){s.start=s.elapsed;}if(k==='view')s.phase=-1;},
 explain:s=>{const q=TRAITS[s.trait];if(s.view!==1)return{title:P(`${q.name[0]}：${q.dom[0]}／${q.rec[0]}`,`${q.name[1]}: ${q.dom[1].toLowerCase()} / ${q.rec[1].toLowerCase()}`),text:q.text};const k=s.phase<0?(s.shown||0):s.phase;return{title:FAM_NAMES[k],text:famText(q,k)};},
 draw:drawTraits},
{id:'abo',title:P('A 加 B 會變 O？','Can A and B make O?'),sub:P('ABO 血型的遺傳','ABO blood groups'),
 hook:P('爸爸是 A 型、媽媽是 B 型，孩子有可能是 O 型嗎？先別急著說不可能，打開基因看看。','Father is type A and mother is type B. Could their child be type O? Before you say no, look at the genes.'),
 body:P('選爸爸和媽媽的基因型，看等位基因分開、精卵結合；點格子可以看那一格是怎麼來的。','Choose the parents\' genotypes and watch the alleles separate and the gametes combine. Tap a cell to see where it came from.'),
 reading:P('ABO 血型：6 種基因型、4 種血型。\nA 型：IᴬIᴬ、Iᴬi\nB 型：IᴮIᴮ、Iᴮi\nAB 型：IᴬIᴮ\nO 型：ii\n\n補充：Iᴬ 和 Iᴮ 在一起時兩個都表現，高中會學到這叫「共顯性」。血型遺傳是練習推理的模型；真正要知道血型、要輸血，都要看驗血的結果。','ABO blood groups: 6 genotypes, 4 blood types.\nType A: IᴬIᴬ, Iᴬi\nType B: IᴮIᴮ, Iᴮi\nType AB: IᴬIᴮ\nType O: ii\n\nExtra: when Iᴬ and Iᴮ are together both show; in senior high this is called codominance. Inheritance puzzles are reasoning practice; a real blood type, or a transfusion, needs a blood test.'),
 closure:P('ABO 血型由 Iᴬ、Iᴮ、i 三種等位基因控制，每個人只有其中兩個。Iᴬ、Iᴮ 對 i 是顯性；Iᴬ 和 Iᴮ 在一起時兩個都表現（AB 型）。Iᴬi × Iᴮi 的孩子，A、B、AB、O 四種血型都有可能。','ABO blood groups are controlled by three alleles, Iᴬ, Iᴮ and i, and each person has two. Iᴬ and Iᴮ are dominant to i; together, Iᴬ and Iᴮ both show (type AB). Children of Iᴬi × Iᴮi can be type A, B, AB or O.'),
 quiz:[
  {q:P('AB 型的人，基因型是？','What is the genotype of a type AB person?'),options:[P('IᴬIᴮ','IᴬIᴮ'),P('IᴬIᴬ','IᴬIᴬ'),P('Iᴬi','Iᴬi'),P('ii','ii')],answer:0,why:P('Iᴬ 和 Iᴮ 在一起時兩個都表現，所以 AB 型只有 IᴬIᴮ 一種。','Iᴬ and Iᴮ both show when together, so type AB is only IᴬIᴮ.'),hint:P('看左邊的表：AB 型那一列有幾種基因型？','Check the table: how many genotypes are in the AB row?')},
  {q:P('爸爸 A 型（Iᴬi）、媽媽 B 型（Iᴮi），孩子可能是哪些血型？','Father is type A (Iᴬi) and mother type B (Iᴮi). Which types can their children have?'),options:[P('只有 O 型，因為都帶 i','Only O, since both give an i'),P('只有 AB 型，不會有別型','Only AB, and no other types'),P('只有 A 型或 B 型兩種','Only A or B, never AB nor O'),P('A、B、AB、O 都有可能','A, B, AB and O are possible')],answer:3,why:P('爸爸給 Iᴬ 或 i，媽媽給 Iᴮ 或 i，四格分別是 IᴬIᴮ、Iᴬi、Iᴮi、ii，四種血型各 1/4。','Father gives Iᴬ or i and mother gives Iᴮ or i: IᴬIᴮ, Iᴬi, Iᴮi and ii, each 1/4.'),hint:P('把爸爸設成 Iᴬi、媽媽設成 Iᴮi，看結果。','Set Father to Iᴬi and Mother to Iᴮi and look at the results.')},
  {q:P('O 型（ii）的爸爸和 AB 型（IᴬIᴮ）的媽媽，孩子可能是哪些血型？','Father is type O (ii) and mother type AB (IᴬIᴮ). Which types can their children have?'),options:[P('A 型或 B 型兩種','Type A or type B only'),P('AB 型或 O 型兩種','Type AB or type O only'),P('四種血型的機會都一樣','Any of the four types'),P('只會是爸爸的 O 型','Only the dad\'s type O')],answer:0,why:P('爸爸只會給 i，媽媽給 Iᴬ 或 Iᴮ，孩子是 Iᴬi（A 型）或 Iᴮi（B 型），不會是 AB 型或 O 型。','Father can only give i and mother gives Iᴬ or Iᴮ, so a child is Iᴬi (A) or Iᴮi (B), never AB or O.'),hint:P('爸爸的精子可能帶什麼？媽媽的卵呢？','What can the father\'s sperm carry? And the mother\'s eggs?')}
 ],
 sources:[],init:()=>({running:true,phase:-1,start:0,pa:'Ai',pb:'Bi',cell:-1}),
 controls:()=>[choice(P('爸爸','Father'),'pa',ABO.map(g=>[g,P(`${gstr(g)}（${typeOf(g)}型）`,`${gstr(g)} (${typeOf(g)})`)])),choice(P('媽媽','Mother'),'pb',ABO.map(g=>[g,P(`${gstr(g)}（${typeOf(g)}型）`,`${gstr(g)} (${typeOf(g)})`)])),choice(P('步驟','Step'),'phase',[[-1,P('連續播放','Play all')],...AB_NAMES.map((n,i)=>[i,n])])],
 act(s,k,v){s[k]=v;if(k==='pa'||k==='pb'){s.cell=-1;s.start=s.elapsed;}if(k==='phase')s.start=s.elapsed;},
 explain:s=>{const k=s.phase<0?(s.shown||0):s.phase;if(s.cell>=0&&k>=2){const sp=[...s.pa].sort(alSort)[s.cell&1],eg=[...s.pb].sort(alSort)[s.cell>>1],g=sp+eg,ty=typeOf(g);
   return{title:P(`這一格：${gstr(g)}（${ty} 型）`,`This cell: ${gstr(g)} (type ${ty})`),text:P(`精子帶 ${gstr(sp)}、卵帶 ${gstr(eg)}，結合成 ${gstr(g)}，血型是 ${ty} 型。四格的機率一樣，各是 1/4。`,`The sperm brings ${gstr(sp)} and the egg ${gstr(eg)}, giving ${gstr(g)}: type ${ty}. Each of the four cells has chance 1/4.`)};}
   return{title:AB_NAMES[k],text:AB_TEXT[k]};},
 draw:drawAbo},
{id:'tokens',title:P('抽 4 次就各一次？','Four draws, one of each?'),sub:P('血型遺傳模擬','Blood group simulation'),
 hook:P('爸爸是 Iᴬi、媽媽是 Iᴮi，理論上 A、B、AB、O 各 1/4。那麼生 4 個孩子，一定剛好四種血型各一個嗎？','Father is Iᴬi and mother Iᴮi, so in theory A, B, AB and O are 1/4 each. With four children, must there be exactly one of each?'),
 body:P('先自己按幾次「抽 10 次」，看結果有多不一樣；再按「加入全班」，比一比全班合起來的比例。','Press "Draw 10" a few times and see how much the results vary; then press "Add class" and compare the whole-class proportions.'),
 reading:P('活動做法：兩個杯子代表爸爸、媽媽，各放兩枚棋子，寫上他的等位基因（爸爸 Iᴬ、i；媽媽 Iᴮ、i）。每次從兩個杯子各抽一枚，代表一個精子和一個卵，組合就是一個孩子的基因型；記錄後放回，再抽下一次。\n\n為什麼要放回？每個孩子都來自一次新的受精，爸爸每次產生帶 Iᴬ 或帶 i 的精子，機率都一樣是一半。','The activity: two cups stand for the parents, each with two tokens marked with that parent\'s alleles (Father Iᴬ and i; Mother Iᴮ and i). Draw one token from each cup: a sperm and an egg, which together give one child\'s genotype. Record it, put the tokens back and draw again.\n\nWhy put them back? Every child comes from a new fertilization, and each sperm carries Iᴬ or i with the same half-and-half chance.'),
 closure:P('每次抽樣都是獨立的，次數少時常常偏離 1：1：1：1；次數越多（例如全班合併），比例越接近每種 1/4。','Every draw is independent. Small samples often stray from 1 : 1 : 1 : 1; the more draws (such as the whole class combined), the closer each type gets to 1/4.'),
 quiz:[
  {q:P('Iᴬi × Iᴮi 只抽 4 次，結果一定是 A、B、AB、O 各一次嗎？','Iᴬi × Iᴮi, just four draws: must you get one each of A, B, AB and O?'),options:[P('不一定，次數少時常常不平均','Not always; few draws can be uneven'),P('一定會剛好各出現一次而已','Yes, always exactly one of each type'),P('一定絕對不會剛好各出現一次','No, never exactly one of each type'),P('只要抽到 AB 型就會停止','Yes, four draws always give all four')],answer:0,why:P('每次都是獨立抽樣，只抽 4 次，同一種血型出現兩次以上很常見。','Every draw is independent; with only four, repeats are common.'),hint:P('按幾次「抽 10 次」，看我的紀錄是不是每種都一樣多。','Press "Draw 10" a few times: are the types ever exactly equal?')},
  {q:P('抽完棋子要放回杯子，代表什麼？','Putting the tokens back stands for what?'),options:[P('每次受精重新開始，機率不變','Each fertilization starts fresh, same chances'),P('爸爸的基因用完了所以要補充','The father has run out of genes and needs more'),P('下一次一定會抽到另一枚棋子','The next draw must be the other kind of token'),P('為了讓杯子比較容易搖得動','It stops the cup from getting too heavy to shake')],answer:0,why:P('每個孩子都來自一次新的受精，精子帶 Iᴬ 或 i 的機率每次都是一半。','Every child is a new fertilization; a sperm carries Iᴬ or i half and half every time.'),hint:P('如果不放回，第二次抽的機率還一樣嗎？','Without putting it back, would the second draw have the same chances?')},
  {q:P('想讓結果更接近 1：1：1：1，該怎麼做？','How do you get results closer to 1 : 1 : 1 : 1?'),options:[P('增加次數，例如把全班資料合起來','Use many more draws, e.g. combine the class'),P('只記錄自己想要看到的那些結果','Record only the results you happen to like'),P('抽到 1：1：1：1 就停下來','Stop drawing as soon as it reads 1 : 1 : 1 : 1'),P('每次抽完都不放回杯子裡也沒關係','Never put the tokens back into the cup at all')],answer:0,why:P('次數越多，偶然的偏差越不明顯，比例越接近理論值。','The more draws, the less chance swings matter.'),hint:P('比較「我自己」和「全班合併」的長條圖。','Compare the "Me" and "Whole class" charts.')}
 ],
 sources:[],init:()=>({running:true,draw:0,mine:[],batch:[],others:{...EMPTY(),n:0},mergeStart:-9,dt:.7,animStart:0}),
 controls:()=>[choice(P('抽樣','Draw'),'draw',[[1,P('抽 1 次','Draw 1')],[10,P('抽 10 次','Draw 10')],[290,P('加入全班（29 人 × 10 次）','Add class (29 × 10)')],[0,P('全部清除','Clear all')]])],
 act(s,k,v){if(k!=='draw')return;s.draw=v;
   if(v===0){s.mine=[];s.batch=[];s.others={...EMPTY(),n:0};s.mergeStart=-9;return;}
   if(v===290){const o=tally(Array.from({length:290},oneDraw));TYPES.forEach(ty=>s.others[ty]+=o[ty]);s.others.n+=290;s.mergeStart=s.elapsed;return;}
   addDraws(s,v);},
 explain:s=>{const {list}=mineShown(s,s.elapsed||0),n=list.length,m=tally(list),o=s.others;
   if(!n&&!o.n)return{title:P('Iᴬi × Iᴮi 抽棋子','Drawing tokens: Iᴬi × Iᴮi'),text:P('爸爸的杯子有 Iᴬ、i，媽媽的杯子有 Iᴮ、i。每次各抽一枚，就是一個孩子的基因型；理論上 A、B、AB、O 各 1/4。','Father\'s cup holds Iᴬ and i, Mother\'s holds Iᴮ and i. One token from each is one child\'s genotype; in theory A, B, AB and O are 1/4 each.')};
   const pct=(c,N)=>TYPES.map(ty=>`${ty} ${N?Math.round(c[ty]/N*100):0}%`).join(D.tr(P('、',', ')));
   const N=n+o.n,cl={};TYPES.forEach(ty=>cl[ty]=m[ty]+o[ty]);
   return{title:o.n?P(`全班合併 ${N} 次`,`Whole class: ${N} draws`):P(`我已抽 ${n} 次`,`${n} draws so far`),
     text:o.n?P(`全班合併：${pct(cl,N)}。次數多了，四種都很接近 25%。`,`Whole class: ${pct(cl,N)}. With many draws, each is close to 25%.`):P(`我自己：${pct(m,n)}。次數少時常常不平均，再多抽幾次，或加入全班。`,`Me: ${pct(m,n)}. Small samples are often uneven; draw more or add the class.`)};},
 draw:drawTokens},
{id:'sex',title:P('生男生女誰決定？','Boy or girl: who decides?'),sub:P('染色體與性別','Chromosomes and sex'),
 hook:P('以前有人說「生不出兒子是媽媽的問題」。生男生女到底是誰決定的？前兩胎都是女兒，第三胎一定是兒子嗎？','People used to say "no son is the mother\'s fault". Who really decides boy or girl? After two daughters, must the third child be a son?'),
 body:P('按「連續播放」：先把 46 條染色體排成 23 對，再看配子怎麼形成、精卵怎麼結合。可以切換男生、女生的細胞。','Play through: sort the 46 chromosomes into 23 pairs, then see how gametes form and combine. Switch between a male and a female cell.'),
 reading:P('染色體圖譜：把一個細胞的染色體拍下來，依大小和形狀兩兩排好，就是染色體圖譜，醫院可以用它檢查染色體的數目和形狀。本頁的染色體長度依真實大小等比例縮小，條紋是示意。\n\n補充：極少數人的性染色體不是 XX 或 XY（例如 XXY），發育也可能不同；國中先學最常見的 XX、XY。','A karyotype is a photo of one cell\'s chromosomes arranged in pairs by size and shape; hospitals use it to check their number and shape. Lengths here are to scale; the bands are only a sketch.\n\nExtra: a very few people have sex chromosomes other than XX or XY (such as XXY), and development can differ; junior high starts with the common XX and XY.'),
 closure:P('人的體細胞有 23 對染色體：22 對體染色體＋1 對性染色體（女 XX、男 XY）。精子帶 X 或 Y、卵都帶 X，所以生男生女由精子決定，每一胎的機率都是各 1/2，不是媽媽的責任。','Human body cells have 23 pairs of chromosomes: 22 pairs of autosomes plus one pair of sex chromosomes (female XX, male XY). Sperm carry X or Y and every egg carries X, so the sperm decides boy or girl, 1/2 each for every child. It is not the mother\'s doing.'),
 quiz:[
  {q:P('人的體細胞有幾條染色體？','How many chromosomes are in a human body cell?'),options:[P('46 條（23 對）','46 (23 pairs)'),P('23 條（12 對）','23 (12 pairs)'),P('44 條（22 對）','44 (22 pairs)'),P('92 條（46 對）','92 (46 pairs)')],answer:0,why:P('體細胞有 46 條，兩兩成對，共 23 對；精子和卵只有 23 條。','Body cells have 46 in 23 pairs; sperm and eggs have 23.'),hint:P('看左邊「體細胞」那一行。','Read the "Body cell" line on the left.')},
  {q:P('決定孩子是男生還是女生的是？','What decides whether a child is a boy or a girl?'),options:[P('精子帶 X 或帶 Y','Whether the sperm carries X or Y'),P('卵帶 X 還是帶 Y','Whether the egg carries X or Y'),P('媽媽懷孕時的身體健康','How healthy the mother\'s body is'),P('懷孕時吃進去的食物','Food eaten during the pregnancy')],answer:0,why:P('卵都帶 X；精子帶 X 是女生（XX），帶 Y 是男生（XY）。','Every egg carries X; an X sperm gives a girl (XX), a Y sperm a boy (XY).'),hint:P('看「受精」那一步：哪一邊有兩種配子？','In "Fertilization", which side has two kinds of gamete?')},
  {q:P('一個家庭已經有兩個女兒，第三胎是男孩的機率是多少？','A family already has two daughters. What is the chance the third child is a boy?'),options:[P('1/2，每一胎都是獨立的','1/2, each birth is independent'),P('1，這次一定輪到男孩了','1, because a boy is now due'),P('1/4，因為前面兩胎是女','1/4, since two girls came first'),P('0，因為已經有兩個女兒了','0, since two girls were born')],answer:0,why:P('每一胎都是一次新的受精，精子帶 X 或 Y 各 1/2，前面的結果不會影響下一次。','Each child is a new fertilization: X or Y sperm, 1/2 each; earlier results do not matter.'),hint:P('精子會記得前面兩胎的結果嗎？','Does a sperm remember the earlier children?')}
 ],
 sources:[],init:()=>({running:true,phase:-1,start:0,sex:'M'}),
 controls:s=>[choice(P('步驟','Step'),'phase',[[-1,P('連續播放','Play all')],...SEX_SHORT.map((n,i)=>[i,n])]),choice(P('看誰的細胞','Whose cell'),'sex',[['M',P('男生 XY','Male XY')],['F',P('女生 XX','Female XX')]])],
 act(s,k,v){s[k]=v;if(k==='phase')s.start=s.elapsed;if(k==='sex'&&s.phase<0){s.phase=0;s.start=s.elapsed;}},
 explain:s=>{const k=s.phase<0?(s.shown||0):s.phase;return{title:SEX_NAMES[k],text:SEX_TEXT(s)[k]};},
 draw:drawSex}
];
B.register({id:'human_inheritance',title:P('人類遺傳：各帶一份，怎麼組合？','Human inheritance: one contribution from each parent'),subtitle:P('從人類性狀、血型，到生男生女','From human traits and blood groups to boy or girl'),cover:'assets/covers/biology_human_inheritance_1019_v1.jpg',
 assetDir:'assets/biology/genetics_originals_1010_v1/',family:P('遺傳與生物技術','Inheritance and biotechnology'),bookName:P('遺傳','Inheritance'),tabs});
})();
