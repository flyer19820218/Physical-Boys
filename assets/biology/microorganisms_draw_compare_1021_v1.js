/* Microorganisms · "Three kingdoms compared" canvas (food tab, view 1), 2026-10-22.
 * A three-column table: prokaryotes / protists / fungi × nucleus, nutrition, cell wall, examples.
 * One step per kingdom: the selected column lights up (yellow frame, full colour, a light band that keeps sliding down
 * the column, its cells glow in one at a time on arrival); the other two fade. The frame eases from column to column.
 * Each column header has a small AI picture of one example with its name (rods = bacilli, Paramecium, shiitake).
 * Cell wall wording stays conservative: most prokaryotes have one, made of different materials from eukaryotes' walls.
 * Clicking a column selects that step. Ticks (green) = yes, crosses (orange) = no, as in the five-kingdom table.
 */
(()=>{'use strict';
const K=window.MicroKit,{P,C,D,clamp,mix,mod,ease,rgba,line,circle,text,measure,splitLines,glow,stageClock,place,fitRect,drawIn}=K;
const N=3,PER=6;
const YES=C.green,NO=C.orange;
const isEn=()=>D.tr([0,1])===1;

const LABELS=[P(`細胞核`,`Nucleus`),P(`營養方式`,`Nutrition`),P(`細胞壁`,`Cell wall`),P(`例子`,`Examples`)];
// a cell = list of lines; each line: {p, mark (true tick / false cross / undefined), sub (muted)}
const COLS=[
 {name:P(`原核生物界`,`Prokaryotes`),pic:'rods.png',cap:P(`桿菌`,`Bacilli`),cells:[
   [{p:P(`沒有`,`No`),mark:false},{p:P(`DNA 沒有核膜包住`,`DNA has no envelope`),sub:true}],
   [{p:P(`藍綠菌：行光合作用`,`Cyanobacteria: photosynthesis`)},{p:P(`許多細菌：從外界獲得養分`,`Many bacteria: nutrients from outside`)}],
   [{p:P(`多數有`,`Most have one`),mark:true},{p:P(`成分和真核生物的不同`,`Unlike eukaryote walls in makeup`),sub:true}],
   [{p:P(`乳酸菌、大腸桿菌、念珠藻、顫藻`,`Lactic acid bacteria, E. coli, Nostoc, Oscillatoria`)}]]},
 {name:P(`原生生物界`,`Protists`),pic:'paramecium_c.png',cap:P(`草履蟲`,`Paramecium`),cells:[
   [{p:P(`有`,`Yes`),mark:true}],
   [{p:P(`藻類：行光合作用`,`Algae: photosynthesis`)},{p:P(`原生動物：攝食`,`Protozoa: ingest food`)}],
   [{p:P(`藻類有`,`Algae: yes`),mark:true},{p:P(`草履蟲、變形蟲沒有`,`Paramecium, Amoeba: no`),mark:false}],
   [{p:P(`草履蟲、變形蟲、矽藻、海帶、紅藻`,`Paramecium, Amoeba, diatoms, kelp, red algae`)}]]},
 {name:P(`真菌界`,`Fungi`),pic:'shiitake.png',cap:P(`香菇`,`Shiitake`),cells:[
   [{p:P(`有`,`Yes`),mark:true}],
   [{p:P(`沒有葉綠體`,`No chloroplasts`)},{p:P(`從外界吸收養分`,`Absorb nutrients from outside`)}],
   [{p:P(`有`,`Yes`),mark:true}],
   [{p:P(`酵母菌、香菇、靈芝`,`Yeast, shiitake, reishi`)}]]}];

// ── helpers ────────────────────────────────────────────────────────────────
function outline(c,x,y,w,h,r,color,lw=3){c.save();c.strokeStyle=color;c.lineWidth=lw;c.beginPath();c.roundRect(x,y,w,h,r);c.stroke();c.restore();}
function tick(c,x,y,r=12,color=YES){circle(c,x,y,r,color,null);c.save();c.strokeStyle=C.deep;c.lineWidth=Math.max(2.5,r*.24);c.lineCap='round';c.lineJoin='round';c.beginPath();c.moveTo(x-r*.45,y+r*.02);c.lineTo(x-r*.1,y+r*.38);c.lineTo(x+r*.48,y-r*.36);c.stroke();c.restore();}
function cross(c,x,y,r=12,color=NO){circle(c,x,y,r,color,null);c.save();c.strokeStyle=C.deep;c.lineWidth=Math.max(2.5,r*.24);c.lineCap='round';c.beginPath();c.moveTo(x-r*.38,y-r*.38);c.lineTo(x+r*.38,y+r*.38);c.moveTo(x+r*.38,y-r*.38);c.lineTo(x-r*.38,y+r*.38);c.stroke();c.restore();}

// ── layout ─────────────────────────────────────────────────────────────────
const LX=20,LW=120,X0=LX+LW+8,CW=(940-X0-16)/3,GAP=8,HEAD_Y=20,HEAD_H=92,LH=27,PAD=10,ICON=30;
const colX=j=>X0+j*(CW+GAP);
// Line breaking: Chinese breaks only after 、：，；。 (words stay whole, no punctuation at a line start);
// English breaks only at spaces (so "E. coli" and "Paramecium," stay intact).
function wrapRows(c,str,w){
  c.save();c.font=K.FONT(22);const fits=s=>c.measureText(s).width<=w,rows=[];let row='';
  const zh=/[一-鿿]/.test(str),chunks=zh?(str.match(/[^、：，；。]+[、：，；。]?/g)||[str]):str.split(/(?<=\s)/);
  for(const ch of chunks){
    if(row&&!fits(row+ch.trimEnd())){rows.push(row.trimEnd());row='';}
    if(!fits(ch.trimEnd())&&zh){for(const g of Array.from(ch)){if(row&&!fits(row+g)&&!/[、：，；。）」]/.test(g)){rows.push(row);row='';}row+=g;}}
    else row+=ch;}
  if(row.trim())rows.push(row.trimEnd());c.restore();return rows;
}
// Lines of one cell, wrapped to the column width (a line with a mark leaves room for the icon).
function cellRows(c,cell){
  const out=[];cell.forEach(it=>{const w=CW-2*PAD-(it.mark!==undefined?ICON:0);
    wrapRows(c,D.tr(it.p),w).forEach((r,q)=>out.push({r,mark:q===0?it.mark:undefined,ind:it.mark!==undefined,sub:!!it.sub}));});
  return out;
}
let LAY=null;
function layout(c){
  const key=isEn()?'en':'zh';if(LAY&&LAY.key===key)return LAY;
  const rows=LABELS.map((lab,i)=>{const n=Math.max(...COLS.map(col=>cellRows(c,col.cells[i]).length),splitLines(c,D.tr(lab),LW-16,22).length);return n;});
  const top=HEAD_Y+HEAD_H+8,avail=580-top,need=rows.reduce((a,n)=>a+n*LH+2*PAD,0),extra=Math.max(0,(avail-need)/rows.length);
  let y=top;const R=rows.map(n=>{const h=n*LH+2*PAD+extra,r={y,h,n};y+=h;return r;});
  return LAY={key,rows:R,top,bottom:y};
}

// ── draw ───────────────────────────────────────────────────────────────────
function draw(c,s,t){
  const {k,tau}=stageClock(s,t,N,PER);
  s.shown=k;
  const L=layout(c);
  // the highlighted column eases from the previous step's column
  const st=s.cp||(s.cp={});
  if(st.k===undefined||t<st.T){st.k=k;st.from=k;st.T=t-9;}
  if(st.k!==k){st.from=st.k;st.k=k;st.T=t;}
  const u=ease((t-st.T)/.7),on=j=>mix(j===st.from?1:0,j===k?1:0,u);
  const top=HEAD_Y,bot=L.bottom;

  // column frames (behind everything)
  COLS.forEach((col,j)=>{const x=colX(j),o=on(j);
    D.round(c,x,top,CW,bot-top,14,'rgba(22,51,43,.9)',null);
    if(o>.01){c.save();c.globalAlpha*=o;D.round(c,x,top,CW,bot-top,14,rgba(C.yellow,.08+.03*Math.sin(t*2.6)),null);
      // a soft light band sliding down the lit column (idle motion)
      c.save();c.beginPath();c.roundRect(x,top,CW,bot-top,14);c.clip();const sy=top-80+mod(t*.22,1)*(bot-top+160),g=c.createLinearGradient(0,sy-70,0,sy+70);
      g.addColorStop(0,rgba(C.white,0));g.addColorStop(.5,rgba(C.white,.09));g.addColorStop(1,rgba(C.white,0));c.fillStyle=g;c.fillRect(x,sy-70,CW,140);c.restore();
      c.restore();}
    D.hit(x,top,CW,bot-top,'phase',j);});
  // row labels and rules
  L.rows.forEach((r,i)=>{
    if(i)line(c,[[LX,r.y],[940,r.y]],rgba(C.white,.16),2);
    const lr=splitLines(c,D.tr(LABELS[i]),LW-16,22),cy=r.y+r.h/2;
    lr.forEach((row,q)=>text(c,row,LX+8,cy+8+(q-(lr.length-1)/2)*LH,22,C.white));});
  line(c,[[LX,L.top-4],[940,L.top-4]],rgba(C.white,.45),2);

  // headers: picture + its name, kingdom name
  COLS.forEach((col,j)=>{const x=colX(j),cx=x+CW/2,o=on(j),a=mix(.4,1,o);
    c.save();c.globalAlpha*=a;
    if(o>.5)glow(c,cx,HEAD_Y+28,CW*.45,C.yellow,(.12+.06*Math.sin(t*3))*o);
    text(c,col.name,cx,HEAD_Y+36,26,o>.5?C.yellow:C.white,'center');
    const cw=measure(c,col.cap,22),pw=76,ph=44,gx=cx-(pw+10+cw)/2,py=HEAD_Y+50,bob=o>.5?2*Math.sin(t*2):0;
    const r=fitRect(col.pic,gx,py,pw,ph);drawIn(c,col.pic,{x:r.x,y:r.y+bob,w:r.w,h:r.h});
    text(c,col.cap,gx+pw+10,py+ph/2+8,22,C.muted);
    c.restore();});

  // cells
  L.rows.forEach((r,i)=>COLS.forEach((col,j)=>{
    const x=colX(j),o=on(j),rows=cellRows(c,col.cells[i]),y0=r.y+(r.h-rows.length*LH)/2;
    // on arrival, the lit column's cells glow in one by one (top to bottom)
    const pop=j===k?clamp((tau-.25-i*.3)/.35):1,flash=j===k?Math.sin(Math.PI*clamp((tau-.25-i*.3)/.9)):0;
    if(flash>0){c.save();c.globalAlpha*=flash*o;D.round(c,x+4,r.y+4,CW-8,r.h-8,10,rgba(C.yellow,.14),null);c.restore();}
    c.save();c.globalAlpha*=mix(.4,1,o)*mix(.35,1,pop);
    rows.forEach((row,q)=>{const yb=y0+q*LH+20,tx=x+PAD+(row.ind?ICON:0);
      if(row.mark===true)tick(c,x+PAD+12,yb-7,12);else if(row.mark===false)cross(c,x+PAD+12,yb-7,12);
      const col2=row.mark===true?YES:row.mark===false?NO:row.sub?C.muted:C.white;
      text(c,row.r,tx,yb,22,o>.5||row.mark!==undefined||row.sub?col2:C.white);});
    c.restore();}));

  // yellow frame on the lit column (drawn last, slides with the easing)
  const fx=mix(colX(st.from),colX(k),u);
  outline(c,fx,top,CW,bot-top,14,C.yellow,3);
  const q=mod(t*.8,1);outline(c,fx-q*7,top-q*7,CW+q*14,bot-top+q*14,14+q*4,rgba(C.yellow,.7*(1-q)),2.5);
}
window.MicroDraw.compare=draw;
})();
