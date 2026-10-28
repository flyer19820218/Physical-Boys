/* Multiple-choice checks for the older "chapter 2 / chapter 3" lesson pages, 2026-10-26.
 * Those pages have no LivingBook shell: every tab is a plain <section> inside #lessons, and the language is the <html lang> attribute.
 * A bank file calls LessonQuiz.addStatic('<unit id>', {'<css selector of a lesson section>': [Q(...), ...]}); one "Quick check" block
 * (question, hint when wrong, answer when right) is appended to the end of each of those sections. It never touches the canvases,
 * the animation, or the lesson controls, and it is re-drawn when the language changes or the page rebuilds the section.
 * Load order on a page: the lesson's own scripts, lesson_quiz_inject_1026_v1.js, this file, then the bank file(s).
 */
(()=>{'use strict';
const LQ=window.LessonQuiz||(window.LessonQuiz={P:(zh,en)=>[zh,en],Q:(q,options,answer,why,hint)=>({q,options,answer,why,hint}),add(){}});
const LETTERS='ABCD',picked=new Map(),mounts=[];
const isEn=()=>document.documentElement.lang==='en'||document.body.classList.contains('lang-en');
const tr=p=>isEn()?p[1]:p[0];
// Same key → same order every time, so the right answer is not always A and does not reshuffle on re-draw.
function order(key,n){let h=2166136261;for(const ch of key)h=Math.imul(h^ch.charCodeAt(0),16777619)>>>0;const a=[...Array(n).keys()];for(let i=n-1;i>0;i--){h=Math.imul(h^(h>>>13),1103515245)+12345>>>0;const j=h%(i+1);[a[i],a[j]]=[a[j],a[i]];}return a;}
function draw(m){
  const host=m.host;if(!host)return;
  host.replaceChildren();
  const h=document.createElement('h3');h.textContent=tr(['隨堂選擇題','Quick check']);host.append(h);
  m.qs.forEach((q,qi)=>{
    const key=m.key+':'+qi,pick=picked.get(key),box=document.createElement('div'),stem=document.createElement('p'),opts=document.createElement('div'),fb=document.createElement('p');
    box.className='quiz-q';stem.className='quiz-stem';opts.className='quiz-options';fb.className='quiz-feedback';
    stem.textContent=`${qi+1}. ${tr(q.q)}`;opts.setAttribute('role','group');opts.setAttribute('aria-label',stem.textContent);fb.setAttribute('aria-live','polite');
    order(key,q.options.length).forEach((oi,pos)=>{
      const o=q.options[oi],b=document.createElement('button');b.type='button';b.textContent=`${LETTERS[pos]}. ${tr(o)}`;
      if(pick===oi)b.classList.add(oi===q.answer?'right':'wrong');
      b.setAttribute('aria-pressed',pick===oi?'true':'false');
      b.addEventListener('click',()=>{picked.set(key,oi);draw(m);});
      opts.append(b);
    });
    if(pick!==undefined){const ok=pick===q.answer;fb.classList.add(ok?'right':'wrong');fb.textContent=ok?`✓ ${tr(['答對了！','Correct! '])}${tr(q.why)}`:`✗ ${tr(['再想想：','Not quite. '])}${tr(q.hint)}`;}
    box.append(stem,opts,fb);host.append(box);
  });
}
function mountOne(m){
  const sec=document.querySelector(m.sel);if(!sec)return false;
  if(m.host&&m.host.isConnected&&m.host.parentElement===sec)return true;
  const host=document.createElement('section');host.className='quiz-block';host.dataset.quizKey=m.key;
  sec.append(host);m.host=host;draw(m);return true;
}
function mountAll(){let all=true;mounts.forEach(m=>{if(!mountOne(m))all=false;});return all;}
let watching=false;
function watch(){
  if(watching)return;watching=true;
  new MutationObserver(()=>mounts.forEach(draw)).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  // The page builds (or rebuilds) its lesson sections after our script runs: keep trying until every section carries its block.
  const root=document.getElementById('lessons')||document.body;
  new MutationObserver(()=>{mountAll();}).observe(root,{childList:true,subtree:false});
  document.addEventListener('DOMContentLoaded',mountAll);window.addEventListener('load',mountAll);
}
LQ.addStatic=function(unit,bank){
  Object.entries(bank).forEach(([sel,qs])=>mounts.push({sel,qs,key:unit+':'+sel,host:null}));
  watch();mountAll();
};
// Pages that build their own container after load (e.g. optics_1's quiz mode) call this once the container exists.
LQ.refresh=mountAll;
})();
