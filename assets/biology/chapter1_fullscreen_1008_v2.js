/* One fullscreen lifecycle for chapter 1. Reuses the original buttons; no model changes. */
(function(root){
 'use strict';
 const installed=new WeakMap();
 function install(doc){
  if(!doc.body.classList.contains('bio-compact-v1'))return null;
  if(installed.has(doc))return installed.get(doc);
  const tr=(zh,en)=>doc.documentElement.lang==='en'?en:zh;
  const benches=[...doc.querySelectorAll('.scope-workbench,.bio-needs-workbench')],buttons=new Map();
  let active=null,backFocus=null,frame=0,revision=0,nativeEstablished=false;
  const nativeElement=()=>doc.fullscreenElement||doc.webkitFullscreenElement||null;
  function sync(){for(const b of benches){const button=buttons.get(b),on=active===b;if(!button)continue;button.dataset.zh=on?'✕ 離開全螢幕':'⛶ 全螢幕操作';button.dataset.en=on?'✕ Exit full screen':'⛶ Full screen';button.textContent=tr(button.dataset.zh,button.dataset.en);button.setAttribute('aria-pressed',String(on));}}
  function fit(){
   if(!active)return;root.BiologyChapter1Compact?.session?.fit();
   const pill=doc.querySelector('.floating-lang-container');if(pill)active.style.setProperty('--bio-lang-clearance',Math.ceil(pill.getBoundingClientRect().width+24)+'px');
   const view=active.querySelector('.bio-needs-view');if(view)active.style.setProperty('--bio-needs-h',Math.max(1,Math.floor(view.getBoundingClientRect().height))+'px');
  }
  function schedule(){if(frame)root.cancelAnimationFrame(frame);frame=root.requestAnimationFrame(()=>{frame=0;fit();});}
  function exitNative(bench){
   if(nativeElement()!==bench)return Promise.resolve();
   const exit=doc.exitFullscreen||doc.webkitExitFullscreen;if(!exit)return Promise.resolve();
   try{return Promise.resolve(exit.call(doc)).catch(()=>{
    // Safari can expose both APIs but only accept its prefixed exit implementation.
    if(nativeElement()===bench&&doc.webkitExitFullscreen&&exit!==doc.webkitExitFullscreen)try{return Promise.resolve(doc.webkitExitFullscreen.call(doc)).catch(()=>{});}catch{}
   });}catch{if(doc.webkitExitFullscreen&&exit!==doc.webkitExitFullscreen)try{return Promise.resolve(doc.webkitExitFullscreen.call(doc)).catch(()=>{});}catch{}return Promise.resolve();}
  }
  function close(){
   if(!active)return;const old=active,focus=backFocus;active=null;backFocus=null;nativeEstablished=false;revision++;
   old.classList.remove('scope-full');old.setAttribute('role','region');old.removeAttribute('aria-modal');doc.body.classList.remove('scope-full-lock');
   if(frame)root.cancelAnimationFrame(frame);frame=0;sync();
   // Restore the layout immediately, even if the browser's native exit is asynchronous.
   exitNative(old);if(focus?.isConnected)focus.focus({preventScroll:true});
   const lamp=doc.getElementById(old.id.replace(/Workbench$/,'')+'Lamp');if(lamp)lamp.dispatchEvent(new root.Event('input',{bubbles:true}));
  }
  function toggle(bench){
   if(active===bench){close();return;}close();active=bench;backFocus=doc.activeElement;nativeEstablished=false;const token=++revision;
   bench.classList.add('scope-full');bench.setAttribute('role','dialog');bench.setAttribute('aria-modal','true');doc.body.classList.add('scope-full-lock');sync();buttons.get(bench)?.focus({preventScroll:true});schedule();
   // Needs uses a viewport overlay so the shared language pill remains available.
   const request=bench.classList.contains('bio-needs-workbench')?null:bench.requestFullscreen||bench.webkitRequestFullscreen;
   if(request)try{Promise.resolve(request.call(bench)).then(()=>{
    if(token!==revision||active!==bench){if(active!==bench)exitNative(bench);return;}
    nativeEstablished=nativeElement()===bench;schedule();
   }).catch(()=>{if(token===revision&&active===bench)schedule();});}catch{/* Viewport fallback is already active. */}
  }
  for(const b of benches){
   const button=b.querySelector('.cell-full')||b.querySelector('.scope-head-tools .primary');if(!button)continue;buttons.set(b,button);
   // Capture precedes the legacy toggle. A click must execute one lifecycle, not two.
   button.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();toggle(b);},true);
   if(typeof root.ResizeObserver==='function'){const observer=new root.ResizeObserver(()=>{if(active===b)fit();});observer.observe(b);const view=b.querySelector('.scope-view,.bio-needs-view');if(view)observer.observe(view);}
  }
  for(const id of ['langZh','langEn'])doc.getElementById(id)?.addEventListener('click',()=>{sync();schedule();});
  for(const button of doc.querySelectorAll('.tab-btn'))button.addEventListener('click',close);
  doc.addEventListener('keydown',e=>{
   if(!active)return;
   if(e.key==='Escape'){e.preventDefault();close();return;}
   if(e.key==='Tab'){
    const items=[...active.querySelectorAll('button,input,select,a[href],summary,[tabindex="0"]')].filter(n=>!n.disabled&&n.getClientRects().length),first=items[0],last=items.at(-1);
    if(e.shiftKey&&doc.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&doc.activeElement===last){e.preventDefault();first?.focus();}
   }
  });
  for(const type of ['fullscreenchange','webkitfullscreenchange'])doc.addEventListener(type,()=>{
   if(!active)return;if(nativeElement()===active){nativeEstablished=true;schedule();}else if(nativeEstablished)close();
  });
  root.addEventListener?.('resize',schedule,{passive:true});root.addEventListener?.('pagehide',close);sync();
  const session={toggle,close,fit,get active(){return active;}};installed.set(doc,session);return session;
 }
 const api={install};root.BiologyChapter1Fullscreen=api;if(root.document)api.session=install(root.document);
})(typeof globalThis==='object'?globalThis:this);
