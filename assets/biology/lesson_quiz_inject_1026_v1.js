/* Multiple-choice question banks for lessons whose data files predate the quiz mechanism, 2026-10-26.
 * The teacher does not want students to write observation notes: every tab gets "question, hint, answer" multiple choice
 * instead (genetics_quiz_1020_v1.js draws them: a wrong pick shows the hint, a right pick shows the answer and why).
 * A bank file calls LessonQuiz.add('<module id>', {<tab id>: [Q(...), ...]}); the questions are attached to the tab specs
 * registered in LivingBook.modules. A tab that already carries its own quiz is left alone.
 * Load order on a page: the lesson's data file, then this file, then the bank file(s), then genetics_quiz_1020_v1.js.
 */
(()=>{'use strict';
const P=(zh,en)=>[zh,en];
// Q(question, [options], index of the right option, why (shown when right), hint (shown when wrong))
const Q=(q,options,answer,why,hint)=>({q,options,answer,why,hint});
function attach(id,bank){
  const B=window.LivingBook,m=B&&B.modules&&B.modules[id];if(!m)return false;
  m.tabs.forEach(t=>{if(bank[t.id]&&!(t.quiz&&t.quiz.length))t.quiz=bank[t.id];});
  return true;
}
window.LessonQuiz={P,Q,add(id,bank){
  if(attach(id,bank))return;
  // the data file registers its module synchronously, so this is only a safety net
  window.addEventListener('load',()=>attach(id,bank),{once:true});
}};
})();
