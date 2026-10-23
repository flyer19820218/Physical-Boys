/* Animals · "One table to compare every animal" canvas (allcompare tab, views 0 and 1), 2026-10-23.
 * A static table (no pictures, no moving parts except the highlight band): 12 rows = 6 vertebrate groups + 6 invertebrate
 * groups, columns = group, breathing organ, fertilization, egg development, body temperature, one example.
 * The table text is window.AnimalsKit.TBL (written in animals_diversity_1023_v1.js), not copied here.
 *   view 0 "full table": every cell is shown; the current row (step) gets a yellow band and a yellow group name.
 *   view 1 "fill-in practice": rows after the current step show a "?" in every cell; the current row fades in; rows before it stay.
 *   step -1 (play all) walks down the twelve rows, 7 s each, and loops.
 * Layout (canvas 960 × 600): a narrow left strip ("Vertebrates" cyan / "Invertebrates" green, text rotated), then six columns.
 *   Text is 22 px everywhere and never shrunk. Column widths are worked out per language from the cell text: every column
 *   starts at the width of its longest cell; if the table is too wide, the column that saves the most width lets only its
 *   longest cell wrap onto a second line, and so on; any width left over is shared out. The row padding then takes the
 *   height that is left, so the whole table is on the canvas in both languages. The layout is cached per language.
 * Static except the band: the pixel-difference check only sees the band pulse and the row change.
 */
(()=>{'use strict';
const K=window.AnimalsKit,{P,C,D,text,measure,splitLines,line,stageClock,smooth,clamp,rgba}=K;
const N=12,PER=7,LH=27,TX=7,TW=946,TOP=8,BOT=594,STRIP=34,PADX=14;
const YELLOW=C.yellow,CYAN=C.cyan,GREEN=C.green;

// wrapped lines of a cell, with the CJK punctuation / bracket clean-up used by the other table module
function rowsOf(c,p,w){
  let r=splitLines(c,D.tr(p),w,22);
  for(let i=1;i<r.length;i++)while(/^[，。、；：！？）」,.;:!?)]/.test(r[i])&&r[i-1].length>1&&/[一-鿿]/.test(r[i-1])){r[i]=r[i-1].slice(-1)+r[i];r[i-1]=r[i-1].slice(0,-1);}
  for(let i=1;i<r.length;i++)while(/^[.,;:!?)]/.test(r[i])&&!/[一-鿿]/.test(r[i-1])){r[i-1]+=r[i][0];r[i]=r[i].slice(1).trimStart();}
  return r.filter(x=>x);}
// widest unbreakable piece of a cell (an English word or one Chinese character)
function minTok(c,p){const s=D.tr(p),toks=s.match(/[A-Za-z0-9]+(?:['–-][A-Za-z0-9]+)*|[^\sA-Za-z0-9]/g)||[''];return Math.max(...toks.map(x=>measure(c,x,22)));}

// column widths, row heights and row tops for the current language (cached)
const CACHE={};
function layout(c){
  const key=D.tr(P('z','e'))+(document.fonts&&document.fonts.check('700 22px "Noto Sans TC"')?'F':'f');
  if(CACHE[key])return CACHE[key];
  const T=K.TBL,cells=[T.head,...T.rows.map(r=>[r.g,...r.c])],avail=TW-STRIP,nc=6;
  const ws=[],minw=[],lv=[];
  for(let j=0;j<nc;j++){ws[j]=cells.map(r=>measure(c,r[j],22)).sort((a,b)=>b-a);minw[j]=Math.max(...cells.map(r=>minTok(c,r[j])))+PADX;lv[j]=0;}
  const wOf=(j,l)=>Math.max(ws[j][Math.min(l,ws[j].length-1)]+PADX,minw[j]);
  let sum=0;for(let j=0;j<nc;j++)sum+=wOf(j,0);
  // too wide: let the longest cell(s) of one column wrap; pick the column whose wrap saves the most width per wrapped cell
  while(sum>avail){let bj=-1,bl=0,bs=0;
    for(let j=0;j<nc;j++)for(let l=lv[j]+1;l<=Math.min(lv[j]+6,ws[j].length-1);l++){
      const sv=(wOf(j,lv[j])-wOf(j,l))/(l-lv[j]);if(sv>bs){bs=sv;bj=j;bl=l;}}
    if(bj<0)break;sum-=wOf(bj,lv[bj])-wOf(bj,bl);lv[bj]=bl;}
  const cw=[];for(let j=0;j<nc;j++)cw[j]=Math.ceil(wOf(j,lv[j]));
  const spare=Math.max(0,avail-cw.reduce((a,b)=>a+b,0));for(let j=0;j<nc;j++)cw[j]+=spare/nc;
  const W=[STRIP,...cw],XS=W.map((_,i)=>TX+W.slice(0,i).reduce((a,b)=>a+b,0));
  const tw=j=>cw[j]-PADX;
  const lines=cells.map(r=>Math.max(...r.map((p,j)=>rowsOf(c,p,tw(j)).length)));
  const content=lines.reduce((a,b)=>a+b,0)*LH,pad=Math.max(6,Math.min(22,(BOT-TOP-8-content)/(N+1)));
  const hH=lines[0]*LH+pad+4,hs=lines.slice(1).map(l=>l*LH+pad),ys=[];let y=TOP+3+hH;hs.forEach(h=>{ys.push(y);y+=h;});
  return CACHE[key]={W,XS,tw,hH,hs,ys,end:y,fits:y<=BOT};}

function cellText(c,p,x,y,h,w,col,a=1){
  const rs=rowsOf(c,p,w),y0=y+(h-rs.length*LH)/2+19;
  c.save();c.globalAlpha*=a;rs.forEach((s,j)=>text(c,s,x,y0+j*LH,22,col));c.restore();}

function draw(c,s,t){
  const T=K.TBL,{k,tau}=stageClock(s,t,N,PER),g=layout(c),XS=g.XS,fill=s.view===1,right=XS[6]+g.W[6];
  s.shown=k;
  // panel
  c.save();c.beginPath();c.roundRect(TX,TOP,TW,g.end-TOP+3,14);c.fillStyle='rgba(11,26,21,.92)';c.fill();c.strokeStyle=rgba(C.edge,1);c.lineWidth=2;c.stroke();c.restore();
  // current-row band (under the text)
  const by=g.ys[k],bh=g.hs[k],pulse=.8+.2*Math.sin(t*2.6),bw=right-XS[1]-6;
  c.save();c.globalAlpha*=pulse;D.round(c,XS[1]+3,by+2,bw,bh-4,10,rgba(YELLOW,.12),null);D.round(c,XS[1]+3,by+6,4,bh-12,2,YELLOW,null);c.restore();
  c.save();c.beginPath();c.roundRect(XS[1]+3,by+2,bw,bh-4,10);c.strokeStyle=rgba(YELLOW,.55*pulse);c.lineWidth=2;c.stroke();c.restore();
  // grid: dotted lines, a solid one under the header
  c.save();c.setLineDash([2,5]);
  [1,2,3,4,5,6].forEach(i=>line(c,[[XS[i],TOP+8],[XS[i],g.end-4]],rgba(C.edge,.95),1.5));
  g.ys.forEach((y,i)=>{if(i&&i!==6)line(c,[[XS[1]+6,y],[right-8,y]],rgba(C.edge,.75),1);});
  c.restore();
  line(c,[[XS[1]+6,g.ys[0]],[right-8,g.ys[0]]],rgba(C.muted,.7),1.5);
  line(c,[[TX+8,g.ys[6]],[right-8,g.ys[6]]],rgba(C.muted,.85),2.5);          // between vertebrates and invertebrates
  // header
  T.head.forEach((p,i)=>cellText(c,p,XS[i+1]+10,TOP+3,g.hH-4,g.tw(i),CYAN));
  // left strip: two groups, rotated labels
  [[0,6,T.strip[0],CYAN],[6,12,T.strip[1],GREEN]].forEach(([a,b,p,col])=>{
    const y1=g.ys[a]+3,y2=(b===12?g.end:g.ys[b])-3;
    D.round(c,TX+4,y1,STRIP-8,y2-y1,10,rgba(col,.16),rgba(col,.8));
    c.save();c.translate(TX+STRIP/2,(y1+y2)/2);c.rotate(-Math.PI/2);text(c,p,0,7,22,col,'center');c.restore();});
  // rows
  T.rows.forEach((r,i)=>{
    const y=g.ys[i],h=g.hs[i],cur=i===k;
    const shown=!fill||i<k?1:(i===k?smooth(clamp(tau/.6)):0);          // fill-in view: rows after the current step stay blank
    cellText(c,r.g,XS[1]+10,y,h,g.tw(0),cur?YELLOW:C.white);
    r.c.forEach((p,j)=>{
      const x=XS[j+2]+10,w=g.tw(j+1);
      if(shown>0)cellText(c,p,x,y,h,w,C.white,shown);
      if(shown<1)cellText(c,P('？','?'),x,y,h,w,C.muted,.55*(1-shown));});});
}
window.AnimalsDraw.table=draw;
})();
