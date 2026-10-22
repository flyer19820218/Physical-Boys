/* Fungi · "molds" canvas (Tab 3: moulds and spores), 2026-10-22.
 * PLACEHOLDER SHELL: draws an animated "under construction" screen so the page runs. The whole file is rewritten later
 * (see fungi_ai_1022/animation_specs.md). Registers window.FungiDraw.molds; it is called as draw(ctx, state, t) on a 960x600 canvas.
 * It must keep setting s.shown (the stage index 0..5) because the caption of the page reads it.
 */
(()=>{'use strict';
const K=window.FungiKit,{P,C,text,stageClock,circle,TAU}=K;
const N=6,PER=6;
const TITLE=P(`分頁 3：黴菌與孢子`,`Tab 3: moulds and spores`);
function draw(c,s,t){
  const {k}=stageClock(s,t,N,PER);
  s.shown=k;
  text(c,TITLE,480,250,28,C.yellow,'center');
  text(c,P(`（施工中：第 ${k+1} / 6 步）`,`(Under construction: step ${k+1} of 6)`),480,300,22,C.muted,'center');
  for(let i=0;i<5;i++){const a=t*1.6+i*TAU/5;circle(c,480+Math.cos(a)*40,380+Math.sin(a)*40,7,C.cyan,null);}
}
window.FungiDraw.molds=draw;
})();
