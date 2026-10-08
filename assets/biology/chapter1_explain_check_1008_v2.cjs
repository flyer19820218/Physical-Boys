/* Source hashes + native Canvas + event simulation. NOT browser/iPad visual verification. */
const fs=require('fs'),path=require('path'),assert=require('assert'),crypto=require('crypto');
const base=path.resolve(__dirname,'../..'),backup=path.join(base,'local-backups/20261008/biology_intro_needs_explanations_v2_pre.2V5y5l');
const read=f=>fs.readFileSync(path.join(base,f),'utf8'),hash=b=>crypto.createHash('sha256').update(b).digest('hex');
let envSource=read('assets/biology/chapter1_compact_check_1008_v1.cjs').split('function normalize(html)')[0];
// Test harness support for native DOM capture / stopImmediatePropagation semantics.
envSource=envSource.replace('stopPropagation(){this.stopped=true;}','stopPropagation(){this.stopped=true;}stopImmediatePropagation(){this.stopped=true;this.immediateStopped=true;}');
envSource=envSource.replace('addEventListener(n,fn){(this.events[n]??=[]).push(fn);}','addEventListener(n,fn,capture=false){const list=this.events[n]??=[];capture?list.unshift(fn):list.push(fn);}');
envSource=envSource.replace('for(const fn of this.events[e.type]||[])fn(e);','for(const fn of this.events[e.type]||[]){fn(e);if(e.immediateStopped)break;}');
const environment=new Function('require','__dirname',envSource+'\nreturn environment;')(require,__dirname);
const newFiles=['chapter1_explain_1008_v2.js','chapter1_fullscreen_1008_v2.js'];
function normalize(s){return s.replace(/^ *<link rel="stylesheet" href="assets\/biology\/chapter1_explain_1008_v2.css">\n/m,'').replace(/<script src="assets\/biology\/chapter1_(?:explain|fullscreen)_1008_v2.js"><\/script>\n/g,'');}
async function test(unit){
 const html=read(`biology_${unit}.html`);assert.equal(normalize(html),fs.readFileSync(path.join(backup,`biology_${unit}.html`),'utf8'),'Only new presentation imports added: '+unit);
 const E=environment(html),d=E.document,id=n=>d.getElementById(n),all=s=>d.querySelectorAll(s),click=n=>{assert(n);n.click();},results=[];
 for(const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)){const src=m[1].match(/src="([^"?]+)/)?.[1];if(src&&newFiles.some(f=>src.endsWith(f)))continue;E.run(src?read(src):m[2],src||unit+' inline');}
 await new Promise(r=>setTimeout(r,100));for(let i=0;i<3;i++)E.advance();
 const beforeButtons=all('button'),beforeImages=all('img').map(n=>[n,n.src]),canvases=all('canvas').map(n=>[n,hash(n.getContext('2d').getImageData(0,0,n.width,n.height).data)]),rafs=E.queue.size;
 newFiles.forEach(f=>E.run(read('assets/biology/'+f),f));
 const A=E.context.BiologyChapter1Explain,F=E.context.BiologyChapter1Fullscreen.session;
 assert(beforeButtons.every(b=>all('button').includes(b)));assert(beforeImages.every(([n,src])=>all('img').includes(n)&&n.src===src));
 for(const [n,sha] of canvases)assert.equal(hash(n.getContext('2d').getImageData(0,0,n.width,n.height).data),sha,'Zero model pixel changes');assert.equal(E.queue.size,rafs);
 assert.equal(A.install(d),A.session);assert.equal(E.context.BiologyChapter1Fullscreen.install(d),F);
 results.push('Original buttons/images retained; zero Canvas pixel changes; no new animation loop');
 click(id('introScreen'));
 const lang=en=>click(id(en?'langEn':'langZh'));
 if(unit==='intro'){
  const s=A.session.needs;assert(s&&s.caption.parentElement===s.bench);assert.equal(s.bench.children.at(-1),s.caption);
  for(const b of id('needsGrid').children){click(b);assert(b.classList.contains('active'));assert(id('needStatus').textContent.length>30);assert(s.caption.querySelector('h4').textContent.length>4);assert(s.caption.querySelector('.bio-observe-note').textContent.includes('看圖重點'));lang(true);assert(!id('needStatus').textContent.match(/[\u3400-\u9fff]/));lang(false);}
  click(s.full);assert(s.bench.classList.contains('scope-full'));F.fit();assert(s.bench.style.getPropertyValue('--bio-needs-h'));click(s.full);assert(!s.bench.classList.contains('scope-full'));
  results.push('Four detailed bilingual conditions; default visible caption below image; fullscreen button exits');
  click(all('[data-choice]').find(b=>b.dataset.choice==='yeast'));click(id('runExperiment'));E.advance(2300);assert(+id('testBalloon').getAttribute('rx')>12);E.advance(2400);assert.equal(+id('testBalloon').getAttribute('rx'),64);results.push('Original yeast animation still runs');
 }else if(unit==='microscope'){
  const s=A.session.parts,transforms=new Set();assert(s&&s.viewport.contains===undefined); // fake DOM deliberately has no layout engine
  for(const b of id('partButtons').children){click(b);transforms.add(s.picture.style.transform);assert(+s.viewport.dataset.zoom>2);assert(!s.marker.hidden);assert(id('partStatus').textContent.length>25);lang(true);assert(!id('partStatus').textContent.match(/[\u3400-\u9fff]/));lang(false);}
  assert.equal(transforms.size,5);click(s.reset);assert.equal(s.picture.style.transform,'none');click(id('partButtons').children[0]);assert.notEqual(s.picture.style.transform,'none');
  const steps=all('#scopeTracking .scope-steps li');assert.equal(steps.length,4);assert(steps.every(n=>n.dataset.zh===n.textContent));assert(d.querySelector('.bio-tracking-steps'));
  results.push('Five distinct original-photo crops + explanations, whole-image reset, unchanged four tracking instructions');
  click(all('.tab-btn').find(b=>b.dataset.tab==='scopeTracking'));const c=id('scopeTrackingCanvas'),sha=hash(c.getContext('2d').getImageData(0,0,640,640).data);for(let f=0;f<60;f++)E.advance();assert.notEqual(hash(c.getContext('2d').getImageData(0,0,640,640).data),sha);const pause=id('scopeTrackingControls').nextElementSibling.querySelector('.primary');click(pause);assert(id('trackingStatus').textContent.includes('暫停'));click(pause);results.push('Original swimming animation and pause adjacency preserved');
 }else{
  const s=id('shapeBench').querySelector('.cell-photo-stage'),ev=(type,p,x)=>s.dispatchEvent(new E.Ev(type,{pointerId:p,clientX:x,clientY:100,pointerType:'touch'}));ev('pointerdown',1,100);ev('pointerdown',2,200);ev('pointermove',2,300);assert.equal(s.dataset.zoom,'2');ev('pointerup',1,100);ev('pointerup',2,300);click(id('shapeBench').querySelector('.cell-photo-controls button'));assert.equal(s.dataset.zoom,'1');assert.equal(id('cellPhotoGallery').children.length,7);results.push('Photo pinch/reset and seven-image atlas retained');
 }
 // All eight existing benches, plus the new needs bench: actual button clicks, not API-only toggles.
 for(const b of all('.scope-workbench')){
  const button=b.querySelector('.cell-full')||b.querySelector('.scope-head-tools .primary');
  for(let pass=0;pass<3;pass++){click(button);assert.equal(F.active,b);assert(b.classList.contains('scope-full'));assert(d.body.classList.contains('scope-full-lock'));lang(true);assert(button.textContent.includes('Exit'));lang(false);assert(button.textContent.includes('離開'));click(button);assert.equal(F.active,null);assert(!b.classList.contains('scope-full'));assert(!d.body.classList.contains('scope-full-lock'));assert.equal(button.getAttribute('aria-pressed'),'false');}
  click(button);E.emit('keydown',{key:'Escape'});assert.equal(F.active,null);assert(!b.classList.contains('scope-full'));
 }
 results.push('Every fullscreen button: three enter/exit cycles, EN/Chinese while open, Esc, body scroll unlock');
 // Native-standard and Safari paths, refusal, and a late-enter promise after close.
 if(unit!=='intro'){
  const b=all('.scope-workbench')[0],button=b.querySelector('.cell-full')||b.querySelector('.scope-head-tools .primary');let exits=0;
  b.requestFullscreen=()=>{d.fullscreenElement=b;E.emit('fullscreenchange');return Promise.resolve();};d.exitFullscreen=()=>{exits++;d.fullscreenElement=null;E.emit('fullscreenchange');return Promise.resolve();};click(button);await Promise.resolve();click(button);await Promise.resolve();assert.equal(exits,1);assert.equal(d.fullscreenElement,null);
  b.requestFullscreen=()=>Promise.reject(Error('Denied'));click(button);await Promise.resolve();await Promise.resolve();assert.equal(F.active,b);click(button);assert.equal(F.active,null);
  let resolve;b.requestFullscreen=()=>new Promise(r=>resolve=r);click(button);click(button);d.fullscreenElement=b;resolve();await new Promise(r=>setTimeout(r,0));assert.equal(d.fullscreenElement,null);assert.equal(F.active,null);
  delete b.requestFullscreen;delete d.exitFullscreen;b.webkitRequestFullscreen=()=>{d.webkitFullscreenElement=b;E.emit('webkitfullscreenchange');return Promise.resolve();};d.webkitExitFullscreen=()=>{exits++;d.webkitFullscreenElement=null;E.emit('webkitfullscreenchange');};click(button);await Promise.resolve();click(button);assert.equal(d.webkitFullscreenElement,null);
  // External browser exit must restore the viewport layout too.
  click(button);await Promise.resolve();d.webkitFullscreenElement=null;E.emit('webkitfullscreenchange');assert.equal(F.active,null);assert(!b.classList.contains('scope-full'));
  results.push('Native standard / Safari exits, denied request fallback, delayed-entry cancellation, external exit cleanup');
 }
 return {unit,originalButtons:beforeButtons.length,originalImages:beforeImages.length,unchangedCanvases:canvases.length,checks:results};
}
async function main(){
 const baseline=JSON.parse(fs.readFileSync(path.join(backup,'baseline.json'),'utf8')),authorized=new Set(['biology_microscope.html','biology_cells.html']);let protectedCount=0;
 for(const e of baseline.protected){if(authorized.has(e.file))continue;assert.equal(hash(fs.readFileSync(path.join(base,e.file))),e.sha256,'Protected file: '+e.file);protectedCount++;}
 for(const unit of ['intro','microscope','cells'])assert.equal(read(`biology_${unit}_compact_ui_preview_1008_v1.html`),fs.readFileSync(path.join(backup,`biology_${unit}_compact_ui_preview_1008_v1.html`),'utf8'),'Old preview unchanged');
 const units=[];for(const unit of ['intro','microscope','cells'])units.push(await test(unit));
 const css=read('assets/biology/chapter1_explain_1008_v2.css');assert.equal((css.match(/{/g)||[]).length,(css.match(/}/g)||[]).length);assert(css.includes('display:inline;font:700 22px'));assert(css.includes('z-index:11'));assert(css.includes('grid-template-rows:auto auto minmax(0,1fr) auto'));
 const report={date:new Date().toISOString(),mode:'Native Canvas and custom DOM event simulation; actual browser CSS and iPad touch NOT verified',protectedFiles:protectedCount,units};
 fs.writeFileSync('/private/tmp/biology_chapter1_explain_1008_v2_qa.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}
main().catch(e=>{console.error(e);process.exitCode=1;});
