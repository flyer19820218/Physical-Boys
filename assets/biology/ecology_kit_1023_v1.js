/* Ecology lesson 1 · shared drawing kit, 2026-10-23. Exposes window.EcologyKit for the per-view drawing modules
 * (ecology_draw_*_1023_v1.js) and ecology_1023_v1.js. Same helpers as animals_kit_1023_v1.js (stage clock, pills, arrows, pictures).
 * Pictures: ecology_ai_1023/ (AI illustrations made by the teacher with Gemini, not photographs). 'cover.jpg' is the lesson cover
 * (assets/covers/biology_ecology_1023_v1.jpg). SIZE = natural pixel size of every picture, so layouts never jump.
 * Every picture function takes just the file name, e.g. place(c,'EC5_sparrow.png',x,y,w,h).
 */
(()=>{'use strict';
const B=window.LivingBook,D=B.D,P=(zh,en)=>[zh,en];
const C={white:'#f2ecd9',yellow:'#fde047',cyan:'#55e9ff',green:'#4ade80',orange:'#fb923c',pink:'#f472b6',panel:'#1c3d34',deep:'#0b1a15',muted:'#b9cbbd',edge:'#47675d',ink:'#0b1a15',
  sand:'#d9c9a0',rock:'#8c8577',sea:'#2a7fa6',seaDeep:'#17506f'};
const TAU=Math.PI*2,clamp=n=>Math.max(0,Math.min(1,n)),mix=(a,b,u)=>a+(b-a)*u,mod=(n,d=1)=>((n%d)+d)%d,ease=u=>1-Math.pow(1-clamp(u),3),smooth=u=>{u=clamp(u);return u*u*(3-2*u);};
const rgba=(hex,a)=>{const n=parseInt(hex.slice(1),16);return `rgba(${n>>16&255},${n>>8&255},${n&255},${a})`;};
function line(c,pts,color,w=3){D.line(c,pts,color,w);}
function sline(c,pts,color,w){c.save();c.lineCap='round';c.lineJoin='round';c.beginPath();pts.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.strokeStyle=color;c.lineWidth=w;c.stroke();c.restore();}
function circle(c,x,y,r,fill,stroke,w=3){c.beginPath();c.arc(x,y,Math.max(.1,r),0,TAU);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=w;c.stroke();}}
function ellipse(c,x,y,rx,ry,fill,stroke,w=3,rot=0){c.beginPath();c.ellipse(x,y,Math.max(.1,rx),Math.max(.1,ry),rot,0,TAU);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=w;c.stroke();}}
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
// Wrapped text; returns the height it used.
function wrap(c,p,x,y,w,size=22,color=C.white,lh=Math.round(size*1.38),align='left'){
  const rows=splitLines(c,D.tr(p),w,size),PUNCT=/^[，。、；：！？）」』,.;:!?)]/;
  for(let i=1;i<rows.length;i++)while(PUNCT.test(rows[i])&&rows[i-1].length>1){
    if(/[A-Za-z]/.test(rows[i-1])&&!/[一-鿿]/.test(rows[i-1])){rows[i-1]+=rows[i][0];rows[i]=rows[i].slice(1).trimStart();}else{rows[i]=rows[i-1].slice(-1)+rows[i];rows[i-1]=rows[i-1].slice(0,-1);}}
  for(let i=0;i<rows.length-1;i++)while(/[（「『(]$/.test(rows[i])&&rows[i].length>1){rows[i+1]=rows[i].slice(-1)+rows[i+1];rows[i]=rows[i].slice(0,-1);}
  rows.filter(r=>r).forEach((r,i)=>text(c,r,x,y+i*lh,size,color,align));return rows.length*lh;}
function glow(c,x,y,r,color=C.cyan,a=.55){c.save();const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,rgba(color,1));g.addColorStop(1,rgba(color,0));c.globalAlpha*=a;c.fillStyle=g;c.beginPath();c.arc(x,y,r,0,TAU);c.fill();c.restore();}
function arrow(c,x1,y1,x2,y2,color,w=3.5){
  const a=Math.atan2(y2-y1,x2-x1),dist=Math.hypot(x2-x1,y2-y1),hl=Math.min(16,Math.max(8,dist*.46)),hw=hl*.66;
  line(c,[[x1,y1],[x2-hl*.7*Math.cos(a),y2-hl*.7*Math.sin(a)]],color,w);
  c.save();c.beginPath();c.moveTo(x2,y2);
  c.lineTo(x2-hl*Math.cos(a)+hw*Math.sin(a),y2-hl*Math.sin(a)-hw*Math.cos(a));
  c.lineTo(x2-hl*Math.cos(a)-hw*Math.sin(a),y2-hl*Math.sin(a)+hw*Math.cos(a));
  c.closePath();c.fillStyle=color;c.fill();c.restore();
}
function dashed(c,pts,color,w=2.5,dash=[7,6],off=0){c.save();c.setLineDash(dash);c.lineDashOffset=off;line(c,pts,color,w);c.restore();}
function panel(c,x,y,w,h,fill='#16332b'){D.round(c,x,y,w,h,16,fill,C.edge);}
// A label pill. Returns {x,y,w,h}; x is clamped into [minX, maxX].
function pill(c,p,x,y,{active=false,color=C.yellow,size=22,maxX=940,minX=20}={}){
  const w=measure(c,p,size)+28,h=size+18;x=Math.max(minX,Math.min(x,maxX-w));
  D.round(c,x,y,w,h,h/2,active?color:'rgba(11,26,21,.9)',active?C.white:rgba(color,.8));
  text(c,p,x+w/2,y+h/2+size*.36,size,active?C.deep:color,'center');
  return{x,y,w,h};
}
const cpill=(c,p,x,y,o={})=>pill(c,p,x-(measure(c,p,o.size||22)+28)/2,y,o);
function pulse(c,x,y,t,color=C.yellow,r=16){const u=mod(t*.8);circle(c,x,y,r+u*16,null,rgba(color,.9*(1-u)),3);}
// Controls: choice(label,key,[[value,label],...]); steps(shortLabels) adds 'Play all' (phase -1) plus one button per step.
const choice=(label,key,items)=>({label,items:items.map(([value,text])=>({key,value,label:text}))});
const steps=(short)=>choice(P('步驟','Step'),'phase',[[-1,P('連續播放','Play all')],...short.map((n,i)=>[i,n])]);
// Stage clock. s.phase<0: loops through n stages, per seconds each. s.phase>=0: holds that stage.
// Returns {k: stage index, u: 0..1 progress in the stage, held, tau: seconds since the stage began}.
function stageClock(s,t,n,per=6){
  if(s.phase>=0)return{k:s.phase,u:ease((t-(s.start||0))/1.6),held:true,tau:t-(s.start||0)};
  const q=mod(t-(s.start||0),n*per)/per;return{k:Math.floor(q),u:q%1,held:false,tau:(q%1)*per};
}
const fade=(tau,t0,d=.6)=>clamp((tau-t0)/d);
function rng(seed){let a=seed>>>0;return()=>{a=a+0x6D2B79F5>>>0;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
function marker(c,x,y,n,t,r=13,color=C.yellow){if(t!=null)pulse(c,x,y,t,color,r+2);circle(c,x,y,r,color,C.ink,2);c.save();c.font=MONO(20);c.fillStyle=C.ink;c.textAlign='center';c.textBaseline='middle';c.fillText(String(n),x,y+1);c.restore();}
const lerpP=(a,b,u)=>[mix(a[0],b[0],u),mix(a[1],b[1],u)];
function bez(p0,p1,p2,u){return[(1-u)*(1-u)*p0[0]+2*(1-u)*u*p1[0]+u*u*p2[0],(1-u)*(1-u)*p0[1]+2*(1-u)*u*p1[1]+u*u*p2[1]];}

// ── pictures ───────────────────────────────────────────────────────────────
const AI='assets/biology/ecology_ai_1023/',COVER='assets/covers/biology_ecology_1023_v1.jpg',PICS={};
// natural pixel size of every picture (known before it loads, so layouts never jump)
const SIZE={"EC10_clownfish_anemone.png": [1111, 1091], "EC10_legume_nodules.png": [1021, 1243], "EC11_nest_fern.png": [1071, 1376], "EC11_remora_shark.png": [1229, 493], "EC12_dodder.png": [1125, 1204], "EC12_wasp_cocoons.png": [1018, 522], "EC13_mantis_grasshopper.png": [692, 1280], "EC14a_daphnia.png": [783, 974], "EC14a_shrimp.png": [1242, 584], "EC14b_bass.png": [1209, 509], "EC14b_crucian.png": [1003, 587], "EC15_apple_snail.png": [1037, 639], "EC15_egg_mass.png": [221, 744], "EC15_field_snail.png": [655, 350], "EC16_spoonbill_fly.png": [1188, 783], "EC16_spoonbill_stand.png": [999, 989], "EC1_shady_moist.png": [929, 948], "EC1_sunny_dry.png": [928, 1116], "EC2_meadow_scene.jpg": [1672, 933], "EC3_foxtail.png": [549, 919], "EC3_miscanthus.png": [774, 1141], "EC3_rice.png": [590, 1096], "EC4_caterpillar.png": [633, 331], "EC4_grasshopper.png": [788, 446], "EC4_vole.png": [634, 568], "EC5_frog.png": [657, 581], "EC5_mantis.png": [803, 760], "EC5_sparrow.png": [723, 612], "EC6_eagle.png": [536, 874], "EC6_owl.png": [383, 836], "EC6_snake.png": [847, 559], "EC7_leaf_brown.png": [530, 926], "EC7_leaf_green.png": [533, 925], "EC7_leaf_skeleton.png": [530, 924], "EC7_leaf_soil.png": [597, 379], "EC8_camphor_tree.png": [1026, 1400], "EC9_beetles_sap.png": [1400, 1167], "SU1_rock.png": [800, 848], "SU1_soil.png": [800, 820], "SU2_lichen.png": [800, 852], "SU2_seedling.png": [800, 824], "SU3_herb.png": [800, 865], "SU3_shrub.png": [800, 993], "SU3_thin.png": [676, 689], "SU4_forest.png": [1000, 649], "cover.jpg": [1672, 933]};
// Pictures from other lessons are addressed as 'folder/file.png' (relative to assets/biology/); their sizes are added here.
Object.assign(SIZE,{"EC19_ladybird_aphids.png":[1400,878],"EC20_wasp_caterpillar.png":[1400,651],"EC21_cleaner_grouper.png":[1400,603],"EC22_ducks_paddy.png":[1400,602],"EC23_stags_duel.png":[1400,454],"EC24_remora_shark.png":[1400,523],"EC25_wasp_cocoons.png":[1400,543],"EC17_paddy_scene.jpg":[1672,933],"EC18_log_decay.png":[1400,493],"animals_ai_1023/earthworm.png":[1125,756],"fungi_ai_1022/shiitake.png":[462,450],"fungi_ai_1022/mushroom_soil.png":[1226,1302],"fungi_ai_1022/woodear_log.png":[902,823],"naming_ai_1021/snail.png":[363,196],"naming_ai_1021/dragonfly.png":[476,340]});
const src=f=>f==='cover.jpg'?COVER:(f.includes('/')?'assets/biology/'+f:AI+f),dim=f=>SIZE[f];
function pic(path){let im=PICS[path];if(!im){im=new Image();im.onload=()=>B.draw();im.onerror=()=>{im.failed=true;};im.src=path;PICS[path]=im;}return im.complete&&im.naturalWidth?im:null;}
function fitRect(file,bx,by,bw,bh){const [W,H]=dim(file),k=Math.min(bw/W,bh/H),w=W*k,h=H*k;return{x:bx+(bw-w)/2,y:by+(bh-h)/2,w,h};}
// Draw a picture into rect r. opts: alpha, flip, clip (rounded corner radius for scene photos), crop [sx,sy,sw,sh] as fractions.
function drawIn(c,file,r,{alpha=1,flip=false,radius=0,crop=null}={}){
  const im=pic(src(file));
  if(!im){c.save();c.setLineDash([6,6]);D.round(c,r.x,r.y,r.w,r.h,10,null,rgba(C.muted,.4));c.restore();return r;}
  if(alpha<=0)return r;
  c.save();c.globalAlpha*=alpha;if(radius){c.beginPath();c.roundRect(r.x,r.y,r.w,r.h,radius);c.clip();}
  if(flip){c.translate(r.x*2+r.w,0);c.scale(-1,1);}
  if(crop){const W=im.naturalWidth,H=im.naturalHeight;c.drawImage(im,crop[0]*W,crop[1]*H,crop[2]*W,crop[3]*H,r.x,r.y,r.w,r.h);}else c.drawImage(im,r.x,r.y,r.w,r.h);
  c.restore();return r;}
// Fit a picture into the box (bx,by,bw,bh), centred.
const place=(c,file,bx,by,bw,bh,o={})=>drawIn(c,file,fitRect(file,bx,by,bw,bh),o);
// Centre a picture at (x, y) with a given width.
function at(c,file,x,y,w,o={}){const [W,H]=dim(file),h=w*H/W;return drawIn(c,file,{x:x-w/2,y:y-h/2,w,h},o);}
// Position inside a rect by fractions.
const pt=(r,fx,fy)=>[r.x+fx*r.w,r.y+fy*r.h];

const EcologyKit={B,D,P,C,TAU,clamp,mix,mod,ease,smooth,rgba,line,sline,circle,ellipse,FONT,MONO,text,measure,splitLines,wrap,glow,arrow,dashed,panel,pill,cpill,pulse,choice,steps,stageClock,fade,rng,marker,lerpP,bez,AI,COVER,SIZE,src,dim,pic,fitRect,drawIn,place,at,pt};
window.EcologyKit=EcologyKit;window.EcologyDraw=window.EcologyDraw||{};
})();
