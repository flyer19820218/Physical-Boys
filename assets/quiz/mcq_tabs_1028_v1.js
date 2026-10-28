/* McqTabs (2026-10-28): gives pages whose tab content is redrawn by script one question container per tab.
 * The container for the active tab is shown, the others are hidden, so each tab keeps its own multiple-choice block.
 * Usage (called by the generated quiz_<lesson>_1028_v1.js): McqTabs.mount({buttons:'<selector of the tab buttons, in tab order>', keys:[...], before:'footer'}). */
(()=>{'use strict';
window.McqTabs={mount(o){
  const btns=[...document.querySelectorAll(o.buttons)],anchor=o.into?document.querySelector(o.into):document.querySelector(o.before||'footer');
  if(!btns.length||!anchor||btns.length!==o.keys.length){console.warn('McqTabs: tab buttons do not match the question keys');return false;}
  if(document.getElementById('mcq-'+o.keys[0]))return true;
  const host=document.createElement('div');host.className='mcq-tabs-host';host.style.cssText='max-width:1500px;margin:0 auto;padding:0 16px';
  o.keys.forEach(k=>{const d=document.createElement('div');d.id='mcq-'+k;d.className='mcq-pane';host.appendChild(d);});
  if(o.into)anchor.appendChild(host);else anchor.parentNode.insertBefore(host,anchor);
  const sync=()=>{const i=Math.max(0,btns.findIndex(b=>b.classList.contains('active')));[...host.children].forEach((d,j)=>{d.style.display=j===i?'':'none';});};
  const mo=new MutationObserver(sync);btns.forEach(b=>mo.observe(b,{attributes:true,attributeFilter:['class']}));
  sync();return true;}};
})();
