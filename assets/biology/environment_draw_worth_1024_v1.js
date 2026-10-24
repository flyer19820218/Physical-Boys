/* Unit 11 lesson 1 · "worth" canvas (biodiversity-value tab, view 2), 2026-10-24. Reasons to keep (plan section 2, worth). No new pictures.
 * Three steps, 10 s each; s.shown = step. s.phase<0 plays all, s.phase>=0 holds a step (pictures breathe, flags sway, rings pulse).
 *  0 card 1 "Useful to people" pops in; three rows appear one by one, each a picture row + a named pill:
 *    food (BD2 white, red, black rice), materials (BD8 cotton, silk cocoons, timber), research (drawn notebook + leaf under a magnifier).
 *  1 card 1 dims; card 2 "Culture and aesthetics" pops in over a dark crop of the lesson cover (sea and rocks at sunset);
 *    rows: festivals (drawn bunting, generic shapes only), landscapes (drawn mountain outline, sun, trees), beauty (BD3 swallowtail + drawn flower).
 *    No picture of any people or any specific culture.
 *  2 card 3 "The value of life itself" pops in over a dark crop of the cover (the tide pool); four named animals (BD6 macaque, blue magpie,
 *    muntjac, Swinhoe's pheasant), no prices, no uses. Then the closing box (two lines, white frame, pulsing ring):
 *    "Usefulness does not mean unlimited collection; conservation is not only about what can be turned into money."; all three cards light up again.
 * Colours: no unit concept colour is used (no green/cyan/pink meaning here); cards are told apart by number, title and pictures, not by colour.
 * Pictures (K.SIZE): BD2_rice_* ~304x301, BD8_cotton 366x490, BD8_silk_cocoons 317x291, BD8_timber 397x300, BD3_swallowtail 337x249,
 * BD6_macaque 260x375, BD6_blue_magpie 274x418, BD6_muntjac 348x363, BD6_swinhoes_pheasant 364x385 (all cut out);
 * cover biology_environmental_diversity_1024_v1.jpg 1672x933, crops in px: card 2 (290,0,447,597), card 3 (650,300,447,597).
 * Card titles and sentences are the view's names/text (environment_diversity_1024_v1.js, VIEWS.worth); new labels are in T below.
 */
(()=>{'use strict';
const K=window.EnvironmentKit,{P,C,D,clamp,mix,mod,smooth,ease,rgba,text,measure,circle}=K;
const L=(k,zh,en)=>(K.LAB&&K.LAB[k])||P(zh,en);
const N=3,PER=10,CW=960,MOVE=.8;
const WHITE=C.white,MUTED=C.muted,SAND=C.sand,PEACH='#e8b4a0';
const E=K.ENV||'environment_ai_1024/',COVER='../covers/biology_environmental_diversity_1024_v1.jpg';

// ── labels (titles and sentences = the view's names / text) ────────────────
const T={
 title:[P('對人有用','Useful to people'),P('文化與美感','Culture and aesthetics'),P('生命本身的價值','The value of life itself')],
 row:[[P('食物','Food'),P('材料','Materials'),P('研究','Research')],[P('節慶','Festivals'),P('景觀','Landscapes'),P('美感','Beauty')]],
 st:[P('食物、材料、研究資源，是生物對人有用的地方。','Food, materials and research resources are ways organisms are useful to people.'),
     P('生物也和文化、節慶、景觀、美感有關。','Organisms are tied to culture, festivals, landscapes and beauty.'),
     P('生物本身也有存在的價值。','Organisms also have value in themselves.')],
 end1:P('有用途不代表可以無限採集；','Usefulness does not mean unlimited collection;'),
 end2:P('保育也不只看能不能換成金錢。','conservation is not only about what can be turned into money.')
};
const ANIMAL=[['BD6_macaque.png',P('臺灣獼猴','Formosan macaque')],['BD6_blue_magpie.png',P('臺灣藍鵲','Taiwan blue magpie')],
  ['BD6_muntjac.png',P('山羌','Reeves\'s muntjac')],['BD6_swinhoes_pheasant.png',P('藍腹鷴','Swinhoe\'s pheasant')]];

// ── layout ────────────────────────────────────────────────────────────────
const CARD=[24,334,644].map(x=>({x,y:16,w:292,h:390}));
const HEAD=70,ROW0=76,ROWH=102,IMG_H=56;
const CROP=[null,[290/1672,0,447/1672,597/933],[650/1672,300/933,447/1672,597/933]];
const Y_ST=424,Y_END=476;
const tItem=i=>1.0+i*1.0,tSt=[4.2,4.2,3.4],tEnd=5.0,tAnimal=i=>1.0+i*.45;

// ── helpers ───────────────────────────────────────────────────────────────
const withA=(c,a,fn)=>{if(a<=0.002)return;c.save();c.globalAlpha*=Math.min(1,a);fn();c.restore();};
function tag(c,p,x,y,{al='left',col=WHITE,size=22,fill='rgba(11,26,21,.92)'}={}){
  const w=measure(c,p,size)+28,h=size+18,bx=al==='right'?x-w:al==='center'?x-w/2:x;
  D.round(c,bx,y,w,h,h/2,fill,rgba(col,.9));text(c,p,bx+w/2,y+h/2+size*.36,size,col,'center');return{x:bx,y,w,h};
}
function ringR(c,r,t,col,rad=14){const u=mod(t*.6);D.round(c,r.x-7*u,r.y-7*u,r.w+14*u,r.h+14*u,rad+7*u,null,rgba(col,.75*(1-u)));}
function badge(c,n,x,y,active){circle(c,x,y,17,active?WHITE:'rgba(11,26,21,.92)',WHITE,2);
  c.save();c.font=K.MONO(22);c.fillStyle=active?C.ink:WHITE;c.textAlign='center';c.textBaseline='middle';c.fillText(String(n),x,y+1);c.restore();}
// one picture fitted in a box around (cx, cy), breathing a little
function pic(c,f,cx,cy,w,h,t,ph=0){const b=1+.03*Math.sin(t*2+ph);K.place(c,E+f,cx-w*b/2,cy-h*b/2,w*b,h*b);}
// statement: one pill, or a wrapped box when it does not fit
function statement(c,p,y,t,on){
  const w1=measure(c,p,22)+28;
  if(w1<=CW-48){const r=tag(c,p,CW/2,y,{al:'center'});if(on)ringR(c,r,t,WHITE,r.h/2);return;}
  const rows=K.splitLines(c,D.tr(p),CW-48-32,22),h=rows.length*30+14;
  D.round(c,24,y,CW-48,h,14,'rgba(11,26,21,.92)',rgba(WHITE,.9));rows.forEach((r,i)=>text(c,r,CW/2,y+30+i*30,22,WHITE,'center'));
}

// ── drawn icons (no pictures) ─────────────────────────────────────────────
function research(c,cx,cy,t){
  // notebook with lines
  const nx=cx-78,ny=cy-26;D.round(c,nx,ny,56,52,6,'rgba(242,236,217,.12)',WHITE);
  for(let i=0;i<3;i++)K.sline(c,[[nx+10,ny+15+i*12],[nx+46,ny+15+i*12]],rgba(WHITE,.7),2);
  // leaf
  const lx=cx+28,ly=cy;c.save();c.translate(lx,ly);c.rotate(-.5);c.beginPath();c.moveTo(-34,0);c.quadraticCurveTo(0,-22,34,0);c.quadraticCurveTo(0,22,-34,0);
  c.fillStyle='rgba(217,201,160,.25)';c.fill();c.strokeStyle=SAND;c.lineWidth=2.5;c.stroke();
  c.beginPath();c.moveTo(-30,0);c.lineTo(30,0);for(let i=-2;i<=2;i++){c.moveTo(i*10,0);c.lineTo(i*10+8,-9);c.moveTo(i*10,0);c.lineTo(i*10+8,9);}
  c.strokeStyle=rgba(SAND,.8);c.lineWidth=1.5;c.stroke();c.restore();
  // magnifier circling slowly over the leaf
  const mx=lx+7*Math.cos(t*1.3),my=ly-4+5*Math.sin(t*1.3);
  circle(c,mx,my,20,'rgba(242,236,217,.10)',WHITE,3.5);K.sline(c,[[mx+14,my+14],[mx+30,my+30]],WHITE,6);
}
function bunting(c,cx,cy,t){
  const x0=cx-118,x1=cx+118,sag=16,y0=cy-22,cols=[WHITE,SAND,PEACH,MUTED];
  const at=u=>[mix(x0,x1,u),y0+sag*4*u*(1-u)];
  c.save();c.beginPath();for(let i=0;i<=20;i++){const [x,y]=at(i/20);i?c.lineTo(x,y):c.moveTo(x,y);}c.strokeStyle=rgba(WHITE,.85);c.lineWidth=2;c.stroke();c.restore();
  for(let i=0;i<8;i++){const u=(i+.5)/8,[x,y]=at(u),sw=4*Math.sin(t*2.2+i*.9);
    c.save();c.beginPath();c.moveTo(x-11,y);c.lineTo(x+11,y);c.lineTo(x+sw,y+30);c.closePath();c.fillStyle=rgba(cols[i%4],.9);c.fill();c.restore();}
  // small sparkles
  for(let i=0;i<3;i++){const x=cx-80+i*80,y=cy+24,a=.5+.5*Math.sin(t*3+i*2),r=5+2*a;
    c.save();c.strokeStyle=rgba(SAND,.5+.5*a);c.lineWidth=2;c.beginPath();c.moveTo(x-r,y);c.lineTo(x+r,y);c.moveTo(x,y-r);c.lineTo(x,y+r);c.stroke();c.restore();}
}
function landscape(c,cx,cy,t){
  const by=cy+24;
  circle(c,cx+70,cy-12+2*Math.sin(t*.9),13,'rgba(253,224,71,.0)',SAND,3);
  K.sline(c,[[cx-120,by],[cx-78,cy-14],[cx-50,cy+4],[cx-12,cy-26],[cx+34,by-6],[cx+60,cy+2],[cx+120,by]],WHITE,3);
  K.sline(c,[[cx-120,by+4],[cx+120,by+4]],rgba(WHITE,.6),2);
  [[cx-96,by],[cx-82,by],[cx+88,by],[cx+102,by]].forEach(([x,y],i)=>{const h=18+(i%2)*6,s=1.5*Math.sin(t*1.6+i);
    c.save();c.beginPath();c.moveTo(x+s,y-h);c.lineTo(x+7,y);c.lineTo(x-7,y);c.closePath();c.strokeStyle=SAND;c.lineWidth=2.5;c.stroke();c.restore();});
}
function flower(c,cx,cy,t){
  const r=1+.05*Math.sin(t*1.8);c.save();c.translate(cx,cy);c.scale(r,r);
  K.sline(c,[[0,10],[2,30]],rgba(SAND,.9),3);
  for(let i=0;i<5;i++){c.save();c.rotate(i*Math.PI*2/5+t*.15);c.beginPath();c.ellipse(0,-11,7,11,0,0,Math.PI*2);c.fillStyle=rgba(PEACH,.85);c.fill();c.restore();}
  circle(c,0,0,6,SAND,null);c.restore();
}

// ── frame ─────────────────────────────────────────────────────────────────
function draw(c,s,t){
  const {k}=K.stageClock(s,t,N,PER);
  s.shown=k;
  const st=s.worthSt||(s.worthSt={});
  if(st.k===undefined){st.k=k;st.from=-1;st.T=t-20;st.start=s.start;}
  if(st.k!==k){st.from=st.k;st.k=k;st.T=t;st.start=s.start;}
  else if(st.start!==s.start){st.start=s.start;st.from=-1;st.T=t;}   // the same step clicked again: replay it
  if(t<st.T){st.T=t;st.from=-1;}
  const tau=t-st.T,x=clamp(tau/MOVE),moving=st.from>=0&&x<1,u=moving?smooth(x):1;
  const endA=k===2?clamp((tau-tEnd)/.6):0;
  // card brightness: past .62 (back to 1 with the closing box), current 1, future 0
  const tgt=(kk,j,end=0)=>j<kk?mix(.62,1,end):j===kk?1:0;
  const fresh=st.from<0&&tau<MOVE;                     // a step entered by click / first frame: its card pops from 0

  CARD.forEach((r,j)=>{
    let a=tgt(k,j,endA),enter=0;
    if(moving){const was=tgt(st.from,j,st.from===2?1:0);a=mix(was,a,u);if(was===0&&j===k)enter=1-u;}
    else if(fresh&&j===k){a=ease(tau/MOVE);enter=1-a;}
    if(a<=.002)return;
    const active=j===k,dy=enter*18;
    withA(c,a,()=>{
      const R={x:r.x,y:r.y+dy,w:r.w,h:r.h};
      // background
      c.save();c.beginPath();c.roundRect(R.x,R.y,R.w,R.h,14);c.clip();
      c.fillStyle='rgba(22,51,43,.95)';c.fillRect(R.x,R.y,R.w,R.h);
      if(CROP[j]){K.drawIn(c,COVER,R,{crop:CROP[j]});c.fillStyle='rgba(11,26,21,.64)';c.fillRect(R.x,R.y,R.w,R.h);}
      c.restore();
      D.round(c,R.x,R.y,R.w,R.h,14,null,active?WHITE:C.edge);
      if(active){c.save();c.lineWidth=4;c.strokeStyle=WHITE;c.beginPath();c.roundRect(R.x,R.y,R.w,R.h,14);c.stroke();c.restore();ringR(c,R,t,WHITE);}
      // header: number + title (wraps to two lines when needed)
      badge(c,j+1,R.x+30,R.y+36,active);
      const tw=R.w-70,rows=K.splitLines(c,D.tr(T.title[j]),tw,22),y0=rows.length>1?R.y+30:R.y+44;
      rows.forEach((row,i)=>text(c,row,R.x+56,y0+i*28,22,WHITE));
      K.sline(c,[[R.x+16,R.y+HEAD],[R.x+R.w-16,R.y+HEAD]],rgba(WHITE,.35),2);
      const cx=R.x+R.w/2;
      const itemA=i=>j<k?1:j>k?0:clamp((tau-tItem(i))/.5);
      if(j<2){
        for(let i=0;i<3;i++){const ia=itemA(i);if(ia<=0)continue;
          const top=R.y+ROW0+i*ROWH,cy=top+6+IMG_H/2+(1-ease(ia))*8;
          withA(c,ia,()=>{
            if(j===0){
              if(i===0)['BD2_rice_white.png','BD2_rice_red.png','BD2_rice_black.png'].forEach((f,q)=>pic(c,f,cx+(q-1)*76,cy,64,IMG_H,t,q));
              if(i===1)['BD8_cotton.png','BD8_silk_cocoons.png','BD8_timber.png'].forEach((f,q)=>pic(c,f,cx+(q-1)*80,cy,74,IMG_H+4,t,q+1));
              if(i===2)research(c,cx,cy,t);
            }else{
              if(i===0)bunting(c,cx,cy,t);
              if(i===1)landscape(c,cx,cy,t);
              if(i===2){pic(c,'BD3_swallowtail.png',cx-44,cy+2*Math.sin(t*1.7),92,IMG_H+6,t);flower(c,cx+62,cy-6,t);}
            }
            tag(c,T.row[j][i],cx,top+66,{al:'center'});
          });}
      }else{
        ANIMAL.forEach(([f,name],i)=>{
          const ia=j<k?1:clamp((tau-tAnimal(i))/.5);if(ia<=0)return;
          const col=i%2,rowI=Math.floor(i/2),ccx=R.x+(col?R.w-74:74),top=R.y+ROW0+rowI*155;
          withA(c,ia,()=>{
            pic(c,f,ccx,top+44,104,80,t,i*1.3);
            const lines=K.splitLines(c,D.tr(name),132,22),h=lines.length*26+12;
            D.round(c,ccx-71,top+88,142,h,10,'rgba(11,26,21,.88)',rgba(WHITE,.55));
            lines.forEach((ln,q)=>text(c,ln,ccx,top+110+q*26,22,WHITE,'center'));
          });
        });
      }
    });
  });

  // statement of the current step (the previous one fades out quickly)
  if(moving&&st.from>=0)withA(c,1-clamp(x*2.5),()=>statement(c,T.st[st.from],Y_ST,t,false));
  const sa=clamp((tau-tSt[k])/.6);
  withA(c,sa,()=>statement(c,T.st[k],Y_ST,t,k<2));
  // closing box (third step)
  if(moving&&st.from===2)withA(c,1-clamp(x*2.5),()=>closing(c,t,false));
  withA(c,endA,()=>closing(c,t,true));

  // notes (all steps)
  text(c,L('schematic','示意','Schematic'),24,590,22,MUTED,'left');
  text(c,L('aiNote','AI 插圖，非實拍','AI illustration, not a photo'),CW-12,590,22,MUTED,'right');
}
function closing(c,t,on){
  const lines=[T.end1,T.end2].flatMap(p=>K.splitLines(c,D.tr(p),CW-48-40,24)),h=lines.length*34+20,r={x:24,y:Y_END,w:CW-48,h};
  D.round(c,r.x,r.y,r.w,r.h,14,'rgba(11,26,21,.94)',null);
  c.save();c.lineWidth=3.5;c.strokeStyle=WHITE;c.beginPath();c.roundRect(r.x,r.y,r.w,r.h,14);c.stroke();c.restore();
  if(on)ringR(c,r,t,WHITE);
  lines.forEach((ln,i)=>text(c,ln,CW/2,r.y+36+i*34,24,WHITE,'center'));
}
window.EnvironmentDraw=window.EnvironmentDraw||{};
window.EnvironmentDraw.worth=draw;
})();
