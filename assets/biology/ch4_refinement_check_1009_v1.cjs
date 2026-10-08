/* Source guard + native Canvas + simulated events. NOT browser CSS or iPad testing. */
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert'),crypto=require('crypto'),cp=require('child_process');
const {loadImage}=require('/Users/lvyanjun/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@napi-rs/canvas');
const base=path.resolve(__dirname,'../..'),read=f=>fs.readFileSync(path.join(base,f),'utf8');
const baselineRevision='73d302e446306520dd1e6e19152712d31681197c';
const head=f=>cp.execFileSync('git',['show',baselineRevision+':'+f],{cwd:base,maxBuffer:32*1024*1024}),hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const out='/private/tmp/biology_ch4_refinement_1009_v1';fs.mkdirSync(out,{recursive:true});
const report={baselineRevision,verification:'Native Canvas and custom event model only; no browser CSS/physical iPad check',sourceGuards:[],covers:[],frames:[],fontFloor:22};
function same(label,a,b){assert.equal(a,b,label);report.sourceGuards.push(label);}
function between(code,a,b){const start=code.indexOf(a),end=code.indexOf(b,start+a.length);assert(start>=0&&end>start);return code.slice(start,end);}
const plantFile='assets/biology/plant_transport_1008_v1.js',plant=read(plantFile),oldPlant=head(plantFile).toString();
same('Plant drawing helpers and sucrose drawing unchanged',between(plant,'const choice=','function rootModel'),between(oldPlant,'const choice=','function rootModel'));
same('Original experiment stage instructions unchanged',between(plant,'const labText=','function celery'),between(oldPlant,'const labText=','function celery'));
same('Whole-plant transport geometry unchanged',between(plant,'function whole','const waterDrivers='),between(oldPlant,'function whole','const tabs='));
for(const id of ['sourceSink','wholePlant']){
 const row=s=>s.split('\n').find(l=>l.includes("{id:'"+id+"'"));same(id+' tab unchanged',row(plant),row(oldPlant));
}
const humanFile='assets/biology/human_transport_1008_v1.js',human=read(humanFile),oldHuman=head(humanFile).toString();
let normalized=human.replace("septum: [.48, .48, .33, .44]","septum: [.43, .51, .15, .40]")
 .replace(between(human,'  function septumOutline','  function heartDraw'),'')
 .replace("    if (s.view === 'heart') {\n      if (s.part === 'septum') septumOutline(ctx, fitted);\n      else focusOutline(ctx, D, fitted, crop);\n    }","    if (s.view === 'heart') focusOutline(ctx, D, fitted, crop);");
same('Human module unchanged except septum crop and outline',normalized,oldHuman);
same('Entire immune module unchanged',read('assets/biology/immune_defense_1008_v1.js'),head('assets/biology/immune_defense_1008_v1.js').toString());
const shellFile='assets/biology/living_book_1008_v1.js',shell=read(shellFile);
const mounted="const enterLesson=()=>{el('introScreen').hidden=true;last=0;draw();};if(window.LivingBookCover)window.LivingBookCover.mount(el('introScreen'),spec,enterLesson);else el('introScreen').addEventListener('click',enterLesson);";
same('Entire lesson shell unchanged except cover mount hook',shell.replace(mounted,"el('introScreen').addEventListener('click',()=>{el('introScreen').hidden=true;last=0;draw();});"),head(shellFile).toString());
same('Original lesson CSS, fullscreen and language rules unchanged',read('assets/biology/living_book_1008_v1.css'),head('assets/biology/living_book_1008_v1.css').toString());
for(const kind of ['plant_transport','human_transport','immune_defense']){
 const file='biology_'+kind+'.html',html=read(file),before=head(file).toString();
 let simple=html.replace(/^ *<link rel="stylesheet" href="assets\/biology\/ch4_(?:cinematic_cover|refinement)_1009_v1.css">\n/gm,'')
  .replace(/\?v=20261009-[^"\s]+/g,'')
  .replace(/^ *<script src="assets\/biology\/ch4_cinematic_cover_1009_v1.js"><\/script>\n/m,'');
 const oldButton=before.match(/  <button id="introScreen"[^>]*>[\s\S]*?<\/button>/)[0];
 simple=simple.replace(/  <button id="introScreen"[^>]*>[\s\S]*?<\/button>/,oldButton);
 if(kind==='plant_transport')simple=simple.replace(/^ *<p><a href="https:\/\/(?:openstax\.org|organismalbio\.biosci\.gatech\.edu)[^\n]+\n/gm,'');
 same(kind+': no other HTML edits',simple,before);
 const cover=html.match(/class="cover-image" src="([^"]+)"/)[1];
 same(kind+': original cover asset untouched',hash(fs.readFileSync(path.join(base,cover))),hash(head(cover)));
}
let prefix=read('assets/biology/chapter1_compact_check_1008_v1.cjs').split('function normalize(html)')[0];
prefix=prefix.replace('addEventListener(n,fn){','removeEventListener(n,fn){this.events[n]=(this.events[n]||[]).filter(f=>f!==fn);}blur(){if(document.activeElement===this)document.activeElement=document.body;}addEventListener(n,fn){')
 .replace('addEventListener:(n,f)=>(events[n]??=[]).push(f)};', 'addEventListener:(n,f)=>(events[n]??=[]).push(f),removeEventListener:(n,f)=>{events[n]=(events[n]||[]).filter(q=>q!==f);}};');
const harness={require,__dirname,console,setTimeout};vm.runInNewContext(prefix+'\nthis.environment=environment;',harness);
function env(kind,reduced=false){
 const E=harness.environment(read('biology_'+kind+'.html')),timers=new Map();let serial=0;
 E.context.setTimeout=(fn,ms)=>{timers.set(++serial,{fn,ms});return serial;};E.context.clearTimeout=id=>timers.delete(id);
 E.context.matchMedia=()=>({matches:reduced});E.context.Date=class extends Date{static now(){return E.now();}};
 E.run(read('assets/biology/ch4_cinematic_cover_1009_v1.js'),'cover controller');E.run(shell,'lesson shell');E.run(read('assets/biology/'+kind+'_1008_v1.js'),kind);
 return Object.assign(E,{timers,B:E.context.LivingBook,screen:E.document.getElementById('introScreen'),main:E.document.querySelector('main.wrap')});
}
function ready(E){const picture=E.screen.querySelector('.cover-image');picture.complete=true;picture.naturalWidth=1672;picture.dispatchEvent(new E.Ev('load'));assert(E.screen.classList.contains('cover-ready'));}
async function coverChecks(){
 for(const kind of ['plant_transport','human_transport','immune_defense']){
  const E=env(kind),screen=E.screen;assert(E.main.inert);assert.equal(E.queue.size,1);assert.equal(screen.textContent.trim(),'');
  for(let i=0;i<10;i++)E.advance(100);assert.equal(E.B.getState().elapsed,0,'Lesson clock waits behind cover');
  ready(E);screen.click();screen.click();assert(!screen.hidden);assert.equal(E.timers.size,1);
  screen.dispatchEvent(new E.Ev('transitionend',{propertyName:'transform'}));assert(!screen.hidden);
  screen.querySelector('.cover-image').dispatchEvent(new E.Ev('transitionend',{propertyName:'opacity',bubbles:true}));assert(!screen.hidden);
  screen.dispatchEvent(new E.Ev('transitionend',{propertyName:'opacity'}));assert(screen.hidden);assert(!E.main.inert);assert.equal(E.timers.size,0);assert(!E.document.documentElement.classList.contains('has-living-cover'));
  assert.equal(E.document.activeElement.id,'title');assert.equal(E.queue.size,1);E.advance();E.advance();assert(E.B.getState().elapsed>0);
  const cover=Object.values(E.B.modules)[0].cover,im=await loadImage(path.join(base,cover));
  report.covers.push({kind,width:im.width,height:im.height,wordless:true,waitsForImage:true,fadeBeforeHidden:true,oneClock:true});
 }
 const fallback=env('plant_transport');ready(fallback);fallback.screen.click();for(const [id,q] of fallback.timers){assert.equal(q.ms,820);fallback.timers.delete(id);q.fn();}assert(fallback.screen.hidden);
 const escape=env('human_transport');ready(escape);escape.emit('keydown',{key:'Escape'});assert(escape.screen.classList.contains('cover-leaving'));escape.screen.dispatchEvent(new escape.Ev('transitionend',{propertyName:'opacity'}));assert(escape.screen.hidden);
 const reduced=env('immune_defense',true);ready(reduced);reduced.screen.click();assert(reduced.screen.hidden);assert.equal(reduced.timers.size,0);
 const failure=env('plant_transport');failure.screen.querySelector('.cover-image').dispatchEvent(new failure.Ev('error'));assert(failure.screen.hidden,'Load failure never traps the lesson');
 report.coverFallbackEscapeReducedMotionAndFailure=true;
}
async function figures(){
 const E=env('plant_transport',true);ready(E);E.screen.click();await new Promise(r=>setTimeout(r,90));
 const canvas=E.document.getElementById('lessonCanvas');
 for(const [tab,name] of [[1,'root'],[2,'transpiration'],[3,'stem']])for(const language of ['zh','en']){
  E.B.setTab(tab);E.B.setLanguage(language);E.document.getElementById('resetButton').click();if(tab===3){E.B.action('prediction','xylem');for(let i=0;i<3;i++)E.B.action('action','next');}
  await new Promise(r=>setTimeout(r,90));
  for(const elapsed of [0,.6,1.5,2.7,3.2,6.4]){E.B.getState().elapsed=elapsed;E.B.draw();const file=name+'_'+language+'_'+elapsed+'.png';fs.writeFileSync(path.join(out,file),canvas.canvas.toBuffer('image/png'));report.frames.push(file);}
 }
 E.B.setTab(1);for(const soil of ['fresh','salty']){E.B.action('soil',soil);assert.equal(E.B.getTab().check(E.B.getState()).netWater,soil==='fresh'?'in':'out');}
 E.B.setTab(3);const text=E.B.getTab().explain(E.B.getState()).text;assert(text[0].includes('蒸散')&&text[0].includes('毛細')&&text[0].includes('根壓')&&text[0].includes('沒有根'));
 const H=env('human_transport',true);ready(H);H.screen.click();await new Promise(r=>setTimeout(r,90));H.B.action('part','septum');H.B.draw();fs.writeFileSync(path.join(out,'septum_zh.png'),H.document.getElementById('lessonCanvas').canvas.toBuffer('image/png'));
}
(async()=>{
 for(const f of [plantFile,humanFile,shellFile,'assets/biology/ch4_cinematic_cover_1009_v1.js'])new vm.Script(read(f),{filename:f});
 await coverChecks();await figures();
 // Reuse the existing exhaustive regression, with whitespace-insensitive wordless covers.
 let regression=read('assets/biology/ch4_new_check_1008_v1.cjs').replace("id('introScreen').textContent,''","id('introScreen').textContent.trim(),''")
  .replaceAll('/private/tmp/biology_ch4_qa_1008_v1',out).replace('(async()=>{','this.regressionPromise=(async()=>{');
 const sandbox={require,__dirname,console,process:{argv:['node','check','--published']},setTimeout,Buffer};vm.runInNewContext(regression,sandbox);await sandbox.regressionPromise;assert(!sandbox.process.exitCode);
 report.regression=JSON.parse(fs.readFileSync(path.join(out,'report.json'),'utf8'));assert.equal(report.regression.textOverflow.length,0);
 const css=read('assets/biology/ch4_refinement_1009_v1.css');assert(css.includes('min-height: 68px'));assert(css.includes('font-size: 22px'));assert(css.includes('font-size: 17px'));
 report.navigation={oldMinimumHeight:136,newMinimumHeight:68,oldSixTabMinimumBlock:282,newSixTabMinimumBlock:144,titleFont:22,subtitleFont:17};
 fs.writeFileSync(path.join(out,'refinement_report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({guards:report.sourceGuards.length,covers:report.covers.length,frames:report.frames.length,textOverflow:0,navigation:report.navigation,out},null,2));
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
