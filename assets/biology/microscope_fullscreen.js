/* Additive presentation layer: move existing controls, never clone/rewrite the microscope model. */
(()=>{
  'use strict';
  const ids=['scopeTypes','scopeLab','scopeInversion','scopeTracking'],panels=new Map();
  const $=id=>document.getElementById(id);
  const tr=(zh,en)=>document.documentElement.lang==='en'?en:zh;
  let active=null,nativeOwned=false,returnFocus=null,layoutRaf=0;
  function text(el,zh,en){el.dataset.zh=zh;el.dataset.en=en;el.textContent=tr(zh,en);return el;}
  function div(cls){const el=document.createElement('div');el.className=cls;return el;}
  function btn(zh,en,handler,cls='action-btn'){const b=text(document.createElement('button'),zh,en);b.type='button';b.className=cls;b.addEventListener('click',handler);return b;}
  function syncButtons(){for(const [id,p] of panels){const on=active===id;text(p.fullButton,on?'✕ 離開全螢幕':'⛶ 全螢幕操作',on?'✕ Exit full screen':'⛶ Full screen');p.fullButton.setAttribute('aria-pressed',String(on));}}
  function sizeView(){
    if(!active)return;const p=panels.get(active),title=p.view.querySelector('.lens-title'),credit=p.view.querySelector('.photo-credit');
    const chrome=(title?.offsetHeight||0)+(credit?.offsetHeight||0)+48;
    p.root.style.setProperty('--view-h',Math.max(80,p.view.clientHeight-chrome)+'px');
    // Redraw through the existing control entry point so stage positions use the current outer size.
    const lamp=$(active+'Lamp');if(lamp)lamp.dispatchEvent(new Event('input',{bubbles:true}));
  }
  function scheduleSize(){if(layoutRaf)cancelAnimationFrame(layoutRaf);layoutRaf=requestAnimationFrame(()=>{layoutRaf=0;sizeView();});}
  function leave(exitNative=true){
    if(!active)return;const p=panels.get(active),focus=returnFocus;active=null;nativeOwned=false;returnFocus=null;
    p.root.classList.remove('scope-full');p.root.setAttribute('role','region');p.root.removeAttribute('aria-modal');
    document.body.classList.remove('scope-full-lock');syncButtons();
    if(layoutRaf){cancelAnimationFrame(layoutRaf);layoutRaf=0;}
    if(exitNative&&(document.fullscreenElement||document.webkitFullscreenElement)===p.root){
      try{const result=(document.exitFullscreen||document.webkitExitFullscreen)?.call(document);result?.catch?.(()=>{});}catch{/* Fixed-position fallback is already closed. */}
    }
    if(focus?.isConnected)focus.focus({preventScroll:true});
    const lamp=$(p.id+'Lamp');if(lamp)lamp.dispatchEvent(new Event('input',{bubbles:true}));
  }
  function toggle(id){
    if(active===id){leave();return;}
    if(active)leave();const p=panels.get(id);returnFocus=document.activeElement;active=id;nativeOwned=false;
    p.root.classList.add('scope-full');p.root.setAttribute('role','dialog');p.root.setAttribute('aria-modal','true');
    document.body.classList.add('scope-full-lock');syncButtons();p.fullButton.focus({preventScroll:true});scheduleSize();
    const request=p.root.requestFullscreen||p.root.webkitRequestFullscreen;
    if(request)try{const result=request.call(p.root);result?.then?.(()=>{if(active!==id&&(document.fullscreenElement||document.webkitFullscreenElement)===p.root)(document.exitFullscreen||document.webkitExitFullscreen)?.call(document);else{nativeOwned=true;scheduleSize();}}).catch?.(()=>{nativeOwned=false;scheduleSize();});}catch{/* iPhone or denied native full screen: keep the viewport-sized layout. */}
  }
  const descriptions={
    scopeTypes:['顯微鏡部件辨認','Microscope parts','點選左側部件名稱，對照右側實體照片。','Select a part name and compare it with the real instrument.'],
    scopeLab:['倍率、亮度與調焦','Magnification, light, and focus','先低倍對焦；保持照明不變，再比較高倍。','Focus at low power; keep illumination fixed when comparing high power.'],
    scopeInversion:['玻片與倒像','Slide and inverted image','左邊移動實際玻片；右邊觀察影像的相反移動。','Move the actual slide on the left; observe the opposite image motion on the right.'],
    scopeTracking:['追蹤移動生物','Track a swimming organism','先低倍找、移到中央，再換高倍；可以暫停練習。','Find at low power, center, then switch to high power; pause to practice.']
  };
  for(const id of ids){
    const lesson=$(id),media=id==='scopeTypes'?lesson.querySelector('.scope-instrument'):$(id+'Canvas');
    const root=media.closest('.board'),visual=id==='scopeTypes'?media:media.closest('.lens-wrap');
    root.id=id+'Workbench';root.classList.add('scope-workbench');root.setAttribute('role','region');
    const ar=id==='scopeTypes'?455/600:media.width/media.height;root.style.setProperty('--ar',String(ar));
    const head=div('scope-head'),tools=div('scope-head-tools'),side=document.createElement('aside'),view=div('scope-view');
    side.className='scope-sidebar';side.tabIndex=0;side.id=id+'Sidebar';view.id=id+'View';
    const d=descriptions[id],heading=text(document.createElement('h3'),d[0],d[1]);heading.id=id+'WorkbenchTitle';
    root.setAttribute('aria-labelledby',heading.id);head.append(heading,tools);
    tools.append(btn('中文','中文',()=>$('langZh').click(),'action-btn scope-language'),btn('EN','EN',()=>$('langEn').click(),'action-btn scope-language'));
    const fullButton=btn('⛶ 全螢幕操作','⛶ Full screen',()=>toggle(id),'action-btn primary');fullButton.id=id+'Full';tools.append(fullButton);
    const help=text(document.createElement('p'),d[2],d[3]);help.className='scope-full-help';side.append(help);
    if(id==='scopeTypes'){
      const photo=div('scope-photo-frame');photo.append(media);
      const credit=root.querySelector('.photo-credit');if(credit)photo.append(credit);view.append(photo);
      root.querySelector('h3')?.remove();
    }else{
      view.append(visual);
      const stage=root.querySelector('.stage-panel');if(stage)side.append(stage);
      const practice=root.querySelector('.scope-practice');if(practice)practice.remove();
    }
    // Glyph choice originally precedes the board; it must remain reachable in native full screen.
    if(id==='scopeInversion')side.append($('glyphButtons').closest('.scope-selector'));
    for(const child of [...root.children]){
      if(child.tagName==='P'&&!child.id){const detail=document.createElement('details');detail.className='scope-side-details';detail.append(text(document.createElement('summary'),'操作說明','Instructions'),child);side.append(detail);}
      else side.append(child);
    }
    root.append(head,side,view);panels.set(id,{id,root,view,fullButton});
    if(typeof ResizeObserver!=='undefined'){const observer=new ResizeObserver(()=>{if(active===id)scheduleSize();});observer.observe(view);}
  }
  for(const id of ['langZh','langEn'])$(id).addEventListener('click',()=>{syncButtons();scheduleSize();});
  document.querySelectorAll('.tab-btn').forEach(b=>b.addEventListener('click',()=>leave()));
  for(const event of ['fullscreenchange','webkitfullscreenchange'])document.addEventListener(event,()=>{
    if(!active)return;const element=document.fullscreenElement||document.webkitFullscreenElement;
    if(element===panels.get(active).root){nativeOwned=true;scheduleSize();}else if(nativeOwned)leave(false);
  });
  document.addEventListener('keydown',e=>{
    if(!active)return;
    if(e.key==='Escape'){e.preventDefault();leave();return;}
    if(e.key==='Tab'){
      const root=panels.get(active).root,items=[...root.querySelectorAll('button,input,select,[tabindex="0"],summary,a[href]')].filter(el=>!el.disabled&&el.getClientRects().length);
      const first=items[0],last=items.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}
    }
  });
  window.addEventListener('resize',scheduleSize);window.addEventListener('pagehide',()=>leave());syncButtons();
})();
