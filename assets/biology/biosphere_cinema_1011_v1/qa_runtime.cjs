/* Real local images + native Canvas + simulated DOM/events, NOT a browser/iPad test. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {fileURLToPath}=require('node:url');
const root=path.resolve(__dirname,'../../..'),biology=path.join(root,'assets/biology');
let source=fs.readFileSync(path.join(biology,'chapter1_compact_check_1008_v1.cjs'),'utf8').split('function normalize(html)')[0];
source=source.replace("get children(){", "get parentNode(){return this.parentElement;}\n get children(){");
source=source.replace("querySelectorAll(s){const found=[];", "querySelectorAll(s){if(s.startsWith(':scope > '))return this.children.filter(e=>e.matches(s.slice(9)));const found=[];");
source=source.replace("addEventListener(n,fn){(this.events[n]??=[]).push(fn);}", "addEventListener(n,fn,capture=false){const list=this.events[n]??=[];capture?list.unshift(fn):list.push(fn);}removeEventListener(n,fn){this.events[n]=(this.events[n]||[]).filter(f=>f!==fn);}replaceWith(n){this.before(n);this.remove();}contains(n){while(n){if(n===this)return true;n=n.parentElement;}return false;}");
source=source.replace("stopPropagation(){this.stopped=true;}","stopPropagation(){this.stopped=true;}stopImmediatePropagation(){this.stopped=true;this.immediateStopped=true;}");
source=source.replace("for(const fn of this.events[e.type]||[])fn(e);", "for(const fn of this.events[e.type]||[]){fn(e);if(e.immediateStopped)break;}");
source=source.replace("setProperty(k,v){this[k]=v;}","setProperty(k,v){this[k]=v;},removeProperty(k){const v=this[k];delete this[k];return v;}");
source=source.replace("getContext(){if(!this.canvas)","getContext(kind){if(kind==='webgl')return null;if(!this.canvas)");
source=source.replace("return this.canvas.getContext('2d');", "const ctx=this.canvas.getContext('2d');if(!ctx._unwrap){const original=ctx.drawImage.bind(ctx);ctx.drawImage=(image,...args)=>original(image.canvas||image,...args);ctx._unwrap=true;}return ctx;");
source=source.replace("super.src=fs.readFileSync(path.join(base,v));", "super.src=fs.readFileSync(v.startsWith('file:')?require('node:url').fileURLToPath(v):path.join(base,v));");
const environment=new Function('require','__dirname',source+'\nreturn environment;')(require,biology);
const sha=n=>crypto.createHash('sha256').update(n.getContext('2d').getImageData(0,0,n.width,n.height).data).digest('hex');
async function main(){
 const html=fs.readFileSync(path.join(root,'biology_intro.html'),'utf8'),E=environment(html),d=E.document,c=E.context;
 const observers=[];
 c.URL=URL;c.setTimeout=setTimeout;c.clearTimeout=clearTimeout;
 c.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});
 c.removeEventListener=()=>{};d.removeEventListener=()=>{};
 c.MutationObserver=class {constructor(fn){this.fn=fn;this.targets=[];observers.push(this);}observe(n,config){this.targets.push([n,config]);}disconnect(){this.targets=[];}};
 c.ResizeObserver=class{observe(){}disconnect(){}};
 d.baseURI='file://'+path.join(root,'biology_intro.html');
 const create=d.createElement;d.createElement=tag=>{const n=create(tag);n.ownerDocument=d;return n;};
 d.createComment=()=>{const n=d.createTextNode('');n.nodeType=8;return n;};
 function notify(node,key){for(const o of observers)if(o.targets.some(([n,config])=>n===node&&config.attributeFilter?.includes(key)))o.fn();}
 for(const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)){
  const src=m[1].match(/src="([^"?]+)/)?.[1];d.currentScript={src:src?'file://'+path.join(root,src):''};
  E.run(src?fs.readFileSync(path.join(root,src),'utf8'):m[2],src||'biology_intro inline');
 }
 const journey=c.biosphereJourney;assert(journey);assert.equal(await journey.ready,journey,'All four runtime images loaded');
 const shell=journey.element,stage=shell.querySelector('.bc-stage'),canvas=journey.canvas;
 canvas._rect={width:1280,height:720};stage._rect={width:1280,height:720};
 const checks=[],check=(name,fn)=>{fn();checks.push(name);};
 const biosphere=d.getElementById('biosphere'),cover=d.getElementById('introScreen');cover.click();
 d.querySelectorAll('.tab-btn').find(n=>n.dataset.tab==='biosphere').click();notify(biosphere,'hidden');
 const shots=shell.querySelectorAll('.bc-shot'),slider=shell.querySelector('.bc-timeline'),play=shell.querySelector('.bc-play'),full=shell.querySelector('.bc-full-button');
 const note=shell.querySelector('.bc-apple-note'),caption=shell.querySelector('.bc-caption');
 check('Original nodes and home icon remain intact',()=>{
  assert(d.getElementById('bioRange'));assert(d.getElementById('bioProbe'));assert(d.getElementById('bioStatus'));
  assert(biosphere.querySelector('.bc-legacy-board').hidden);assert(d.querySelector('.home-fab').querySelectorAll('path').length===2);
 });
 check('Four shot selectors use the compressed 20-second timeline',()=>{
  for(const [i,expected] of [0,5,10,44*20/48].entries()){shots[i].click();assert(Math.abs(journey.state.time-expected)<1e-10);assert.equal(journey.state.shot,i);}
 });
 check('Timeline input captures its requested value before pausing',()=>{slider.value='10.5';slider.dispatchEvent(new E.Ev('input'));assert.equal(journey.state.time,10.5);assert.equal(slider.value,'10.5');});
 check('Final apple appears only in the final hold, with the numeric scale',()=>{
  journey.seek(10);assert(note.hidden);journey.seek(17);assert(note.hidden);journey.seek(20);assert(!note.hidden);assert.equal(note.style.opacity,'1');
  assert(caption.textContent.includes('0.16 毫米'));assert(caption.textContent.includes('不代表真正果皮固定'));assert(note.textContent.includes('10 公分'));
 });
 check('Chinese / English switching preserves controls and updates explanations',()=>{
  journey.setLanguage('en');assert(caption.textContent.includes('0.16 mm'));assert(caption.textContent.includes('not a measurement'));assert.equal(shell.querySelector('.bc-timeline'),slider);assert.equal(slider.max,'20');
  journey.setLanguage('zh');assert.equal(d.documentElement.lang,'zh-Hant');assert(caption.textContent.includes('蘋果皮'));
 });
 check('Final Earth drag really changes textured globe pixels',()=>{
  journey.seek(20);const before=sha(canvas);canvas.dispatchEvent(new E.Ev('pointerdown',{pointerId:1,clientX:300,clientY:300}));canvas.dispatchEvent(new E.Ev('pointermove',{pointerId:1,clientX:450,clientY:330}));canvas.dispatchEvent(new E.Ev('pointerup',{pointerId:1}));assert.notEqual(sha(canvas),before);
 });
 check('Play reaches 20 seconds and automatically pauses on the final frame',()=>{
  journey.seek(0);play.click();assert(journey.state.playing);for(let i=0;i<82;i++)E.advance(250);assert.equal(journey.state.time,20);assert(!journey.state.playing);assert(!note.hidden);
 });
 check('Replay restarts and background / hidden-tab events stop playback',()=>{
  shell.querySelector('.bc-transport').querySelectorAll('button').at(-1).click();assert(journey.state.playing);assert.equal(journey.state.time,0);
  d.hidden=true;E.emit('visibilitychange');assert(!journey.state.playing);d.hidden=false;journey.play();assert(journey.state.playing);
  biosphere.hidden=true;notify(biosphere,'hidden');assert(!journey.state.playing);biosphere.hidden=false;
 });
 check('Fullscreen repeatedly restores its parent, body overflow, and controls',()=>{
  const parent=shell.parentNode;for(let i=0;i<3;i++){full.click();assert(journey.state.fullscreen);assert.equal(shell.parentNode,d.body);assert.equal(d.body.style.overflow,'hidden');if(i===1)E.emit('keydown',{key:'Escape'});else full.click();assert(!journey.state.fullscreen);assert.equal(shell.parentNode,parent);assert.notEqual(d.body.style.overflow,'hidden');}
 });
 // Emulate the standard API separately from the CSS overlay fallback.
 shell.requestFullscreen=()=>{d.fullscreenElement=shell;E.emit('fullscreenchange');return Promise.resolve();};d.exitFullscreen=()=>{d.fullscreenElement=null;E.emit('fullscreenchange');return Promise.resolve();};
 journey.openFullscreen();await Promise.resolve();assert(journey.state.fullscreen);d.fullscreenElement=null;E.emit('fullscreenchange');assert(!journey.state.fullscreen);checks.push('Browser fullscreenchange exit restores the lesson (simulated event)');
 check('Original yeast experiment and other tabs still respond',()=>{
  const correct=d.querySelectorAll('[data-choice]').find(n=>n.dataset.choice==='yeast');correct.click();d.getElementById('runExperiment').click();E.advance(4700);assert.equal(+d.getElementById('testBalloon').getAttribute('rx'),64);d.getElementById('resetExperiment').click();
  for(const button of d.querySelectorAll('.tab-btn')){button.click();assert.equal(d.querySelectorAll('.lesson').filter(n=>!n.hidden).length,1);}
 });
 check('Destroy restores the original biosphere board',()=>{journey.destroy();assert(!biosphere.querySelector('.board').hidden);assert(!biosphere.querySelector('.bc-shell'));});
 const failed=c.BiosphereCinema.mount({assetBase:'file:///private/tmp/biosphere-deliberately-missing/'});assert.equal(await failed.ready,null);assert.equal(failed.element.dataset.ready,'error');assert(!failed.element.querySelector('.bc-error').hidden);assert(failed.element.querySelector('.bc-play').disabled);failed.destroy();checks.push('Missing images show an honest error instead of a fake working animation');
 const report={kind:'Simulated DOM/events with real images and native software Canvas. Not browser or iPad verification.',duration:20,checks,actualWebGL:false,actualBrowser:false,physicalIPad:false};
 const output=path.join(__dirname,'qa_20s_apple');fs.mkdirSync(output,{recursive:true});fs.writeFileSync(path.join(output,'runtime_report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
}
main().catch(e=>{console.error(e);process.exitCode=1;});
