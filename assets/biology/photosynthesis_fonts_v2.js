/* Repaint after real local fonts load; never silently treat a fallback as V5 font verification. */
(function(){'use strict';if(!document.fonts)return;const checks=[['700 22px "Noto Sans TC"','曉臻光合作用'],['700 22px "JetBrains Mono"','6CO2']];
 Promise.all(checks.map(([font,text])=>document.fonts.load(font,text))).then(result=>{if(result.some(r=>r.length===0)||checks.some(([font,text])=>!document.fonts.check(font,text)))throw Error('V5 local fonts did not load');window.PhotosynthesisLesson?.draw();}).catch(error=>{console.error('Photosynthesis V2 font verification failed',error);const status=document.getElementById('fontStatus');if(status)status.hidden=false;});
 document.fonts.addEventListener('loadingdone',()=>window.PhotosynthesisLesson?.draw());
})();
