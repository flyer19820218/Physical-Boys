/* 動手做「⛶ 全螢幕操作」：左控制欄＋右大畫布；不改畫布繪圖，座標換算本來就用 getBoundingClientRect */
(function(){
  'use strict';
  var cur=null, moved=[], html=document.documentElement;
  function en(){ try{ return typeof currentLang!=='undefined' && currentLang==='en'; }catch(e){ return false; } }
  function label(btn,on){
    var z=on?'✕ 離開全螢幕':'⛶ 全螢幕操作', e=on?'✕ Exit full screen':'⛶ Full-screen mode';
    btn.setAttribute('data-zh',z); btn.setAttribute('data-en',e); btn.textContent=en()?e:z;
  }
  function enter(p,btn){
    if(cur) leave();
    var wrap=p.querySelector('.canvas-wrap'), cv=wrap&&wrap.querySelector('canvas');
    if(!cv) return;
    p.style.setProperty('--ar',(cv.width/cv.height).toFixed(4));
    moved=[];
    Array.prototype.slice.call(wrap.children).forEach(function(ch){
      if(ch!==cv && ch.tagName!=='CANVAS'){ moved.push({el:ch,parent:wrap,next:ch.nextSibling}); }
    });
    moved.forEach(function(m){ p.insertBefore(m.el,wrap.nextSibling); });
    p.classList.add('fs-on'); html.classList.add('hf-lock'); cur=p; label(btn,true);
    try{ var rf=p.requestFullscreen||p.webkitRequestFullscreen; if(rf) { var r=rf.call(p); if(r&&r.catch) r.catch(function(){}); } }catch(e){}
    p.scrollTop=0;
    setTimeout(function(){ window.dispatchEvent(new Event('resize')); },60);
  }
  function leave(){
    var p=cur; if(!p) return; cur=null;
    p.classList.remove('fs-on'); html.classList.remove('hf-lock');
    for(var i=moved.length-1;i>=0;i--){ var m=moved[i]; m.parent.appendChild(m.el); }
    moved=[];
    var btn=p.querySelector('.hf-btn'); if(btn) label(btn,false);
    var fe=document.fullscreenElement||document.webkitFullscreenElement;
    if(fe){ try{ (document.exitFullscreen||document.webkitExitFullscreen).call(document); }catch(e){} }
    setTimeout(function(){ window.dispatchEvent(new Event('resize')); p.scrollIntoView({block:'start'}); },60);
  }
  function init(){
    document.querySelectorAll('.lab-panel').forEach(function(p){
      if(p.querySelector('.hf-btn')) return;
      if(p.closest('[hidden],.gb-oldlab,.el-oldlab')) return;
      var wrap=p.querySelector('.canvas-wrap'); var cv=wrap&&wrap.querySelector('canvas');
      if(!cv || cv.width<900) return;
      var b=document.createElement('button'); b.type='button'; b.className='hf-btn'; label(b,false);
      b.addEventListener('click',function(){ if(p.classList.contains('fs-on')) leave(); else enter(p,b); });
      p.appendChild(b);
    });
  }
  document.addEventListener('keydown',function(e){ if(e.key==='Escape' && cur) leave(); });
  function fsChange(){ if(cur && !(document.fullscreenElement||document.webkitFullscreenElement) && cur.__nat){ leave(); } }
  document.addEventListener('fullscreenchange',function(){ if(cur){ if(!document.fullscreenElement && cur.__nat) leave(); else cur.__nat=!!document.fullscreenElement; } });
  document.addEventListener('webkitfullscreenchange',function(){ if(cur){ if(!document.webkitFullscreenElement && cur.__nat) leave(); else cur.__nat=!!document.webkitFullscreenElement; } });
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
  window.addEventListener('load',init);
})();
