/* Multiple-choice checks for the rebuilt genetics units, 2026-10-20.
 * Replaces the open-ended note box: students pick an answer and the page marks it at once.
 * A tab carries quiz:[{q,options,answer,why,hint}]; picks are kept per tab while the page is open.
 * Options are shown in a fixed order shuffled per question, so the right answer is not always A.
 */
(()=>{'use strict';
const B=window.LivingBook;if(!B)return;
const tr=p=>B.D.tr(p),picked=new Map(),LETTERS='ABCD';
// Same key → same order every time (no reshuffle on tab or language change).
function order(key,n){let h=2166136261;for(const ch of key)h=Math.imul(h^ch.charCodeAt(0),16777619)>>>0;const a=[...Array(n).keys()];for(let i=n-1;i>0;i--){h=Math.imul(h^(h>>>13),1103515245)+12345>>>0;const j=h%(i+1);[a[i],a[j]]=[a[j],a[i]];}return a;}
let host=document.getElementById('quizBlock');
if(!host){host=document.createElement('section');host.id='quizBlock';host.className='quiz-block';document.querySelector('.closure').after(host);}
function render(){
  const tab=B.getTab(),qs=(tab&&tab.quiz)||[];
  host.hidden=!qs.length;host.replaceChildren();if(!qs.length)return;
  const h=document.createElement('h3');h.textContent=tr(['隨堂選擇題','Quick check']);host.append(h);
  qs.forEach((q,qi)=>{
    const key=tab.id+':'+qi,pick=picked.get(key),box=document.createElement('div'),stem=document.createElement('p'),opts=document.createElement('div'),fb=document.createElement('p');
    box.className='quiz-q';stem.className='quiz-stem';opts.className='quiz-options';fb.className='quiz-feedback';
    stem.textContent=`${qi+1}. ${tr(q.q)}`;opts.setAttribute('role','group');opts.setAttribute('aria-label',stem.textContent);fb.setAttribute('aria-live','polite');
    order(key,q.options.length).forEach((oi,pos)=>{
      const o=q.options[oi],b=document.createElement('button');b.type='button';b.textContent=`${LETTERS[pos]}. ${tr(o)}`;
      if(pick===oi)b.classList.add(oi===q.answer?'right':'wrong');
      b.setAttribute('aria-pressed',pick===oi?'true':'false');
      b.addEventListener('click',()=>{picked.set(key,oi);render();});
      opts.append(b);
    });
    if(pick!==undefined){const ok=pick===q.answer;fb.classList.add(ok?'right':'wrong');fb.textContent=ok?`✓ ${tr(['答對了！','Correct! '])}${tr(q.why)}`:`✗ ${tr(['再想想：','Not quite. '])}${tr(q.hint)}`;}
    box.append(stem,opts,fb);host.append(box);
  });
}
// The shell rebuilds the tab buttons on every tab or language change.
new MutationObserver(render).observe(document.getElementById('lessonTabs'),{childList:true});
render();
})();
