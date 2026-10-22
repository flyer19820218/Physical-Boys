/* Fungi · "yeast" canvas (Tab 2: three bottles with balloons), 2026-10-22.
 * PLACEHOLDER SHELL: draws an animated "under construction" screen so the page runs. The whole file is rewritten later
 * (see fungi_ai_1022/animation_specs.md). Registers window.FungiDraw.yeast; it is called as draw(ctx, state, t) on a 960x600 canvas.
 * It must keep setting s.shown (the stage index 0..3) because the caption of the page reads it.
 */
(()=>{'use strict';
const K=window.FungiKit,{P,C,text,stageClock,circle,TAU}=K;
const N=4,PER=6;
const TITLE=P(`分頁 2：三瓶加氣球`,`Tab 2: three bottles with balloons`);
function draw(c,s,t){
  const {k}=stageClock(s,t,N,PER);
  s.shown=k;
  text(c,TITLE,480,250,28,C.yellow,'center');
  text(c,P(`（施工中：第 ${k+1} / 4 步）`,`(Under construction: step ${k+1} of 4)`),480,300,22,C.muted,'center');
  for(let i=0;i<5;i++){const a=t*1.6+i*TAU/5;circle(c,480+Math.cos(a)*40,380+Math.sin(a)*40,7,C.cyan,null);}
}
window.FungiDraw.yeast=draw;
})();
