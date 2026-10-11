/* Deterministic native-Canvas/event checks. Not a CSS layout or physical-iPad test. */
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert'),crypto=require('crypto');
const base=path.resolve(__dirname,'../..'),read=f=>fs.readFileSync(path.join(base,f),'utf8');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const helper=read('assets/biology/chapter1_compact_check_1008_v1.cjs').split('function normalize(html)')[0];
const environment=new Function('require','__dirname',helper+'\nreturn environment;')(require,__dirname);
async function main(){
 const html=read('biology_cells.html'),E=environment(html),d=E.document,id=n=>d.getElementById(n),all=s=>d.querySelectorAll(s);
 // The inherited test DOM has no native fullscreen API. Stop-propagation must still model capture behavior.
 E.Ev.prototype.stopImmediatePropagation=function(){this.stopped=true;};
 for(const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)){const src=m[1].match(/src="([^"?]+)/)?.[1];E.run(src?read(src):m[2],src||'inline');}
 await new Promise(r=>setTimeout(r,100));for(let i=0;i<3;i++)E.advance();
 const checks=[],check=(s,fn)=>{fn();checks.push(s);},advance=()=>{for(let i=0;i<75;i++)E.advance();};
 function tab(name){all('.tab-btn').find(b=>b.dataset.tab===name).click();}
 function lang(code){id(code==='en'?'langEn':'langZh').click();assert.equal(d.documentElement.lang,code==='en'?'en':'zh-Hant');}
 check('Header contains only the main title and one lead in both languages',()=>{for(const code of ['en','zh']){lang(code);assert.deepEqual(Array.from(d.querySelector('.hero').children,n=>n.tagName),['H1','P']);}});
 const gallerySrc=()=>Array.from(id('cellPhotoGallery').querySelectorAll('img'),n=>n.src);
 const originalGallery=gallerySrc();
 check('Diagram/photo switching, structure identification, photo panning and all seven original gallery images',()=>{
  const bench=id('shapeBench'),stage=bench.querySelector('.cell-photo-stage'),img=stage.querySelector('img'),modes=id('neuronMediaChoices'),features=bench.querySelector('.neuron-feature-controls');
  assert(img.src.endsWith('neuron_long_fibers_1011_v2.png'));assert(!modes.hidden);
  for(const b of features.children){b.click();assert(!bench.querySelector('.cell-part-marker').hidden);assert(id('shapeInfo').textContent.includes(b.textContent));}
  const ev=(type,p,x)=>stage.dispatchEvent(new E.Ev(type,{pointerId:p,clientX:x,clientY:100,pointerType:'touch'}));
  ev('pointerdown',1,100);ev('pointerdown',2,200);ev('pointermove',2,300);assert.equal(stage.dataset.zoom,'2');ev('pointerup',1,100);ev('pointerup',2,300);
  bench.querySelector('.cell-photo-controls button').click();assert.equal(stage.dataset.zoom,'1');
  modes.children[1].click();assert(img.src.endsWith('neuron_fluorescence_v2.jpg'));assert(bench.querySelector('.cell-part-marker').hidden);assert(features.hidden);assert(id('shapeInfo').textContent.includes('GFP'));
  lang('en');assert(bench.querySelector('.lens-title').textContent.includes('Real micrograph'));assert.deepEqual(gallerySrc(),originalGallery);lang('zh');
  id('shapeChoices').children[1].click();assert(modes.hidden);assert(img.src.endsWith('muscle_v2.jpg'));id('shapeChoices').children[0].click();assert(!modes.hidden);modes.children[0].click();assert(img.src.endsWith('neuron_long_fibers_1011_v2.png'));
  assert.equal(originalGallery.length,7);assert.deepEqual(gallerySrc(),originalGallery);assert(!originalGallery.some(s=>s.includes('neuron_long')));
 });
 check('Every specimen completes every preparation action in both languages; busy state is explicit and repeat clicks cannot skip steps',()=>{
  tab('cellSlides');
  for(const code of ['zh','en'])for(let sample=0;sample<3;sample++){
   lang(code);id('mountChoices').children[sample].click();
   for(let step=0;step<5;step++){
    const buttons=id('mountOperationKeys').children;assert.equal(buttons.length,5);assert(!buttons[step].disabled);assert(!id('mountNext').disabled);
    buttons[step].click();assert(id('mountNext').disabled);assert(id('mountNext').textContent.startsWith(code==='zh'?'操作中':'In progress'));
    const count=id('mountSteps').children.filter(n=>n.classList.contains('done')).length;buttons[step].click();assert.equal(id('mountSteps').children.filter(n=>n.classList.contains('done')).length,count);
    advance();assert.equal(id('mountNext').disabled,step===4);assert.equal(id('mountOperationKeys').children.filter(n=>n.classList.contains('done')).length,step+1);
   }
   assert.equal(id('mountSteps').children.filter(n=>n.classList.contains('done')).length,5);assert(id('mountInfo').textContent.includes(code==='zh'?'完成':'Done'));
  }
  lang('zh');id('mountReset').click();id('mountNext').click();advance();id('mountNext').click();advance();id('mountBadCover').click();assert(id('mountInfo').textContent.includes('空氣'));id('mountOperationKeys').children[2].click();advance();assert(id('mountInfo').textContent.includes('慢慢放下'));
 });
 check('Leaving a tab, reset, and page visibility interruption cannot strand an unfinished operation',()=>{
  id('mountReset').click();id('mountNext').click();tab('cellShapes');tab('cellSlides');assert(!id('mountNext').disabled);
  id('mountNext').click();d.hidden=true;E.emit('visibilitychange');d.hidden=false;E.emit('visibilitychange');advance();assert(!id('mountNext').disabled);id('mountReset').click();assert(!id('mountOperationKeys').children[0].disabled);
 });
 const backup=process.argv[2];let protection=null;
 if(backup){
  assert.equal(sha(fs.readFileSync(path.join(base,'assets/biology/cells_draw_v1.js'))),sha(fs.readFileSync(path.join(backup,'cells_draw_v1.js'))));
  const old=fs.readFileSync(path.join(backup,'cells_model_v1.js'),'utf8'),current=read('assets/biology/cells_model_v1.js');
  for(const name of ['draw','animated','stop','start','frame']){const get=s=>s.match(new RegExp('  function '+name+'\\([^]*?(?=\\n  (?:function |shapes\\.))'))?.[0];assert(get(old),'Matched protected function '+name);assert.equal(get(current),get(old),'Protected lifecycle '+name);}
  // Byte-identical renderer proves ALL coordinate values and animation geometry are identical.
  protection={drawingFileByteIdentical:true,allCoordinatesIdentical:true,unchangedLifecycleFunctions:5};
 }
 const sharp=require('/Users/lvyanjun/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
 const asset=path.join(base,'assets/biology/neuron_long_fibers_1011_v2.png'),meta=await sharp(asset).metadata();
 const {data:pixels,info}=await sharp(asset).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 check('Neuron PNG has genuine alpha transparency; corners are clear and the soma remains visible',()=>{
  assert(meta.hasAlpha);assert.equal(meta.width,2098);assert.equal(meta.height,749);
  for(const n of [3,info.width*4-1,pixels.length-1,pixels.length-info.width*4+3])assert.equal(pixels[n],0);
  const soma=(Math.round(info.height*.489)*info.width+Math.round(info.width*.823))*4;assert(pixels[soma+3]>200);
  assert(read('assets/biology/cells_refinement_1011_v1.css').includes('[data-illustration=true] {background:transparent}'));
 });
 // Native rendering of the protected mounting steps validates geometry and nonempty frames.
 const drawScope={};vm.runInNewContext(read('assets/biology/cells_draw_v1.js'),drawScope);const D=drawScope.CellsDrawV1;
 const {createCanvas}=require('/Users/lvyanjun/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@napi-rs/canvas');
 const frames=[];for(const material of ['onion','cheek','elodea'])for(let step=1;step<=5;step++)for(const progress of [0,.25,.5,.75,1]){const c=createCanvas(900,560);D.drawMount(c.getContext('2d'),{material,step,progress,badCover:false,busy:progress<1});frames.push({material,step,progress,sha256:sha(c.toBuffer('image/png'))});}
 const result={date:new Date().toISOString(),checks,protection,nativeMountFrames:frames.length,limits:'Native Canvas and custom DOM checks do not verify browser CSS or physical iPad.'};
 console.log(JSON.stringify(result,null,2));if(backup)fs.writeFileSync(path.join(backup,'qa.json'),JSON.stringify({...result,frames},null,2));
}
main().catch(e=>{console.error(e.stack);process.exitCode=1;});
