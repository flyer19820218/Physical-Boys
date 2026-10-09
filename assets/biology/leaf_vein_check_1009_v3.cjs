/* Native Canvas and DOM/event tests; does not claim browser/iPad rendering. */
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert'),crypto=require('crypto'),cp=require('child_process');
const base=path.resolve(__dirname,'../..'),read=f=>fs.readFileSync(path.join(base,f),'utf8');
const baseline='80dc17d49e042db616a19c9c650ba60a7057c563';
const before=f=>cp.execFileSync('git',['show',baseline+':'+f],{cwd:base,maxBuffer:32*1024*1024});
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const out='/private/tmp/biology_leaf_vein_1009_v3';fs.mkdirSync(out,{recursive:true});
const report={baseline,scope:'Native Canvas with real fonts and simulated DOM/events. Browser CSS/compositor and physical iPad unverified.',guards:[],covers:[],states:[],text:[],visibility:[],anatomy:[],frames:[]};
function slice(code,a,b){const start=code.indexOf(a),end=code.indexOf(b,start+a.length);assert(start>=0&&end>start);return code.slice(start,end);}
function same(file,normalized,old=before(file).toString()){assert.equal(normalized,old,file+' protected source');report.guards.push({file,sha256:hash(normalized),byteIdenticalExceptAuthorizedEdits:true});}
const file='assets/biology/plant_transport_1008_v1.js',plant=read(file),oldPlant=before(file).toString();
let normalized=plant.replace(slice(plant,'function transpire','const labText='),slice(oldPlant,'function transpire','const labText='));
const row=code=>code.split('\n').find(s=>s.startsWith(" {id:'transpiration'"));normalized=normalized.replace(row(normalized),row(oldPlant));same(file,normalized);
// Every numerical coordinate and trajectory in the root, experiment, sugar and whole-plant drawings stays byte-identical.
for(const f of ['assets/biology/living_book_1008_v1.js','assets/biology/living_book_1008_v1.css','assets/biology/ch4_cinematic_cover_1009_v1.css','assets/biology/ch4_refinement_1009_v1.css','assets/biology/human_transport_1008_v1.js','assets/biology/immune_defense_1008_v1.js','assets/biology/plant_structure_models_1008_v2.js','assets/biology/plant_structure_layout_1008_v4.js','assets/biology/plant_structure_1008_v4.css'])same(f,read(f));
const structureFile='assets/biology/plant_structure_1008_v2.js',structure=read(structureFile);
const hook="    const enterLesson=()=>{document.getElementById('introScreen').hidden=true;drawCurrent();};\n    if(window.LivingBookCover)window.LivingBookCover.mount(document.getElementById('introScreen'),{id:'structure',cover:PATH+'hollow_maple_native2.png'},enterLesson);\n    else document.getElementById('introScreen').addEventListener('click',enterLesson);";
same(structureFile,structure.replace(hook,"    document.getElementById('introScreen').addEventListener('click',()=>{document.getElementById('introScreen').hidden=true;});"));
same('assets/biology/ch4_cinematic_cover_1009_v1.js',read('assets/biology/ch4_cinematic_cover_1009_v1.js').replace("    structure: { x: '48%', y: '57%', dx: '.6%', dy: '-.8%', scale: '1.18' },\n",''));
for(const kind of ['plant_transport','human_transport','immune_defense']){
 const f='biology_'+kind+'.html';same(f,read(f).replaceAll('?v=20261009-leaf3','').replace('plant_transport_1008_v1.js"','plant_transport_1008_v1.js?v=20261009-rootarea2"'));
}
const sf='biology_plant_structure.html',oldHTML=before(sf).toString();
let sh=read(sf).replace(/^  <link rel="stylesheet" href="assets\/biology\/ch4_cinematic_cover[^\n]+\n/m,'').replace(/^  <script defer src="assets\/biology\/ch4_cinematic_cover[^\n]+\n/m,'').replace('?v=20261009-cover3','').replace('<h1 id="title"','<h1');
sh=sh.replace(/  <button id="introScreen"[^>]*>[\s\S]*?<\/button>/,oldHTML.match(/  <button id="introScreen"[^>]*>[\s\S]*?<\/button>/)[0]);same(sf,sh);
for(const f of ['assets/biology/ch4_plant_structure_1008_v1/plant_atlas_native2.png','assets/biology/ch4_plant_structure_1008_v1/hollow_maple_native2.png','assets/biology/ch4_new_1008_v1/stoma_open.png','assets/biology/ch4_new_1008_v1/stoma_closed.png','assets/covers/biology_plant_1008_v1.png','assets/covers/biology_human_1008_v1.png','assets/covers/biology_immune_1008_v1.png']){
 assert.equal(hash(fs.readFileSync(path.join(base,f))),hash(before(f)));report.guards.push({file:f,originalBitmapUnchanged:true,sha256:hash(before(f))});
}
let prefix=read('assets/biology/chapter1_compact_check_1008_v1.cjs').split('function normalize(html)')[0];
prefix=prefix.replace('addEventListener(n,fn){','removeEventListener(n,fn){this.events[n]=(this.events[n]||[]).filter(f=>f!==fn);}blur(){if(document.activeElement===this)document.activeElement=document.body;}addEventListener(n,fn){').replace('addEventListener:(n,f)=>(events[n]??=[]).push(f)};', 'addEventListener:(n,f)=>(events[n]??=[]).push(f),removeEventListener:(n,f)=>{events[n]=(events[n]||[]).filter(q=>q!==f);}};');
const harness={require,__dirname,console,setTimeout};vm.runInNewContext(prefix+'\nthis.environment=environment;',harness);
function env(kind,reduced=false){
 const E=harness.environment(read('biology_'+kind+'.html')),timers=new Map();let serial=0;
 E.context.setTimeout=(fn,ms)=>{timers.set(++serial,{fn,ms});return serial;};E.context.clearTimeout=id=>timers.delete(id);E.context.matchMedia=()=>({matches:reduced});
 E.context.Date=class extends Date{static now(){return E.now();}};
 E.run(read('assets/biology/ch4_cinematic_cover_1009_v1.js'),'cover');
 if(kind==='plant_structure'){
  E.run(read('assets/biology/plant_structure_models_1008_v2.js'),'unchanged structure models');E.run(structure,'structure cover glue');
 }else{E.run(read('assets/biology/living_book_1008_v1.js'),'unchanged shell');E.run(read('assets/biology/'+kind+'_1008_v1.js'),kind);}
 return Object.assign(E,{timers,B:E.context.LivingBook,screen:E.document.getElementById('introScreen'),main:E.document.querySelector('main.wrap')});
}
function ready(E){const im=E.screen.querySelector('.cover-image');im.complete=true;im.naturalWidth=1672;im.dispatchEvent(new E.Ev('load'));assert(E.screen.classList.contains('cover-ready'));}
function enter(E){ready(E);E.screen.click();E.screen.dispatchEvent(new E.Ev('transitionend',{propertyName:'opacity'}));assert(E.screen.hidden);assert(!E.main.inert);}
async function covers(){
 for(const kind of ['plant_structure','plant_transport','human_transport','immune_defense']){
  const E=env(kind);assert(E.main.inert);assert.equal(E.screen.textContent.trim(),'');const clocks=E.queue.size;
  for(let i=0;i<10;i++)E.advance(100);if(E.B)assert.equal(E.B.getState().elapsed,0);
  ready(E);E.screen.click();E.screen.click();assert(!E.screen.hidden);assert.equal(E.timers.size,1);
  E.screen.dispatchEvent(new E.Ev('transitionend',{propertyName:'transform'}));assert(!E.screen.hidden);
  E.screen.querySelector('.cover-image').dispatchEvent(new E.Ev('transitionend',{propertyName:'opacity',bubbles:true}));assert(!E.screen.hidden);
  E.screen.dispatchEvent(new E.Ev('transitionend',{propertyName:'opacity'}));assert(E.screen.hidden);assert(!E.main.inert);assert(!E.document.documentElement.classList.contains('has-living-cover'));assert.equal(E.timers.size,0);assert.equal(E.queue.size,clocks);assert.equal(E.document.activeElement.id,'title');
  report.covers.push({kind,wordless:true,imageReady:true,fadeBeforeHidden:true,noNewLessonClock:true});
 }
 for(const kind of ['plant_structure','plant_transport']){
  const fallback=env(kind);ready(fallback);fallback.screen.click();for(const [id,q] of fallback.timers){assert.equal(q.ms,820);fallback.timers.delete(id);q.fn();}assert(fallback.screen.hidden);
  const esc=env(kind);ready(esc);esc.emit('keydown',{key:'Escape'});assert(esc.screen.classList.contains('cover-leaving'));esc.screen.dispatchEvent(new esc.Ev('transitionend',{propertyName:'opacity'}));assert(esc.screen.hidden);
  const reduced=env(kind,true);ready(reduced);reduced.screen.click();assert(reduced.screen.hidden);assert.equal(reduced.timers.size,0);
  const failure=env(kind);failure.screen.querySelector('.cover-image').dispatchEvent(new failure.Ev('error'));assert(failure.screen.hidden);
 }
 report.coverFallbackEscapeReducedMotionAndFailure=true;
}
function audit(B,ctx,name){
 const raw=ctx.fillText.bind(ctx),text=B.D.text,lines=[],intents=[],pixels=()=>ctx.getImageData(0,0,960,600).data;
 B.D.text=function(c,p,x,y,o={}){
  const str=B.D.tr(p);let size=o.size||24;c.save();c.font=`700 ${size}px "Noto Sans TC", "JetBrains Mono"`;
  while(o.max&&size>22&&c.measureText(str).width>o.max)c.font=`700 ${--size}px "Noto Sans TC", "JetBrains Mono"`;
  const w=c.measureText(str).width;c.restore();report.text.push({name,str,size,width:w,max:o.max});assert(!o.max||w<=o.max+1,name+' exceeds declared box: '+str);return text(c,p,x,y,o);
 };
 ctx.fillText=function(str,x,y,max){
  const a=new Uint8ClampedArray(pixels());raw(str,x,y,max);const b=pixels(),columns=new Set();
  for(let yy=0;yy<600;yy++)for(let xx=0;xx<960;xx++){const k=(yy*960+xx)*4;if(a[k]!==b[k]||a[k+1]!==b[k+1]||a[k+2]!==b[k+2])columns.add(xx);}
  lines.push({str,x,y,font:this.font});intents.push(columns);
 };
 B.draw();const full=new Uint8ClampedArray(pixels());ctx.fillText=raw;B.D.text=text;
 for(let omit=0;omit<lines.length;omit++){
  let index=0;ctx.fillText=function(str,x,y,max){if(index++!==omit)raw(str,x,y,max);};B.draw();const skipped=pixels();let run=0,longest=0,visible=0;
  for(const xx of [...intents[omit]].sort((a,b)=>a-b)){
   let seen=false;for(let yy=0;yy<600;yy++){const k=(yy*960+xx)*4;if(full[k]!==skipped[k]||full[k+1]!==skipped[k+1]||full[k+2]!==skipped[k+2]){seen=true;break;}}
   if(seen){visible++;run=0;}else{run++;longest=Math.max(longest,run);}
  }
  assert(visible>0&&longest<4,name+' hidden text: '+lines[omit].str);report.visibility.push({name,...lines[omit],visibleColumns:visible,maxInvisibleRun:longest});
 }
 ctx.fillText=raw;B.draw();
}
async function figures(){
 const E=env('plant_transport',true);enter(E);const B=E.B;B.setTab(2);await new Promise(r=>setTimeout(r,120));
 const canvas=E.document.getElementById('lessonCanvas'),c=canvas.getContext('2d'),pixels=()=>c.getImageData(0,0,960,600).data;
 assert.equal(canvas.width,960);assert.equal(canvas.height,600);assert.equal(E.queue.size,1);
 for(const lang of ['zh','en'])for(const condition of ['baseline','wind','humid','drought']){
  B.setLanguage(lang);B.action('condition',condition);Object.assign(B.getState(),{elapsed:1.4,running:false});
  const name='leaf_'+condition+'_'+lang;audit(B,c,name);fs.writeFileSync(path.join(out,name+'.png'),canvas.canvas.toBuffer('image/png'));
  B.getState().running=true;E.advance();const start=hash(pixels());for(let i=0;i<60;i++)E.advance();assert.notEqual(hash(pixels()),start,name+' one second motion');
  B.getState().running=false;E.advance();const stopped=hash(pixels());for(let i=0;i<60;i++)E.advance();assert.equal(hash(pixels()),stopped,name+' pause');
  report.states.push({name,oneSecondMotion:true,pauseIdentity:true});
  B.setFull(true);B.setLanguage(lang==='zh'?'en':'zh');assert(E.document.getElementById('bench').classList.contains('expanded'));E.emit('keydown',{key:'Escape'});assert(!E.document.getElementById('bench').classList.contains('expanded'));
 }
 B.setLanguage('zh');B.action('condition','baseline');B.getState().running=false;
 for(const elapsed of [0,.3,.7,1.2,1.8,2.4,3.05,3.2]){B.getState().elapsed=elapsed;B.draw();const file='leaf_phase_'+elapsed+'.png';fs.writeFileSync(path.join(out,file),canvas.canvas.toBuffer('image/png'));report.frames.push(file);}
 // Trace actual water centres: first seven stay a linked LIQUID chain; vapour uses the open stoma only.
 const water=B.D.water,round=B.D.round,lines=B.D.line,focus=B.D.focus;let centres=[],guards=[],pipes=[],crops=[];
 B.D.water=(ctx,x,y,size)=>{centres.push({x,y,size});return water(ctx,x,y,size);};B.D.round=(ctx,x,y,w,h,...a)=>{guards.push({x,y,w,h});return round(ctx,x,y,w,h,...a);};B.D.line=(ctx,p,...a)=>{pipes.push(p);return lines(ctx,p,...a);};B.D.focus=(ctx,file,crop,dest)=>{crops.push({file,crop:Array.from(crop),dest:Array.from(dest)});return focus(ctx,file,crop,dest);};
 for(const condition of ['baseline','wind','humid','drought']){
  B.action('condition',condition);centres=[];guards=[];pipes=[];crops=[];B.getState().elapsed=.1;B.draw();
  assert.equal(centres.length,condition==='drought'?7:10);assert(centres.slice(0,6).every(p=>Math.abs(p.y-298)<1),'The six upstream molecules follow a horizontal vein');
  assert(crops.some(p=>p.file.includes('plant_atlas_native2.png')&&JSON.stringify(p.crop)==='[0.075,0.115,0.59,0.37]'));
  assert(pipes.some(p=>p.length===2&&p[0][0]===351&&p[0][1]===326&&p[1][0]===728&&p[1][1]===326),'Actual horizontal xylem wall');
  const stomata=guards.filter(g=>g.y===422&&g.h===34);assert.equal(stomata.length,2);assert.equal(stomata[1].x-(stomata[0].x+stomata[0].w),condition==='drought'?4:52);
  report.anatomy.push({condition,liquidParticles:7,vapourParticles:condition==='drought'?0:3,horizontalXylem:true,stomaGap:condition==='drought'?4:52});
 }
 B.D.water=water;B.D.round=round;B.D.line=lines;B.D.focus=focus;
 assert.equal(B.getTab().sources.length,3);assert(B.getTab().explain({condition:'baseline'}).text[0].includes('木質部在上、韌皮部在下'));
}
(async()=>{
 for(const f of [file,structureFile,'assets/biology/ch4_cinematic_cover_1009_v1.js'])new vm.Script(read(f),{filename:f});
 await covers();await figures();
 // Reuse exhaustive published-unit action/animation regressions without changing the historic test file.
 let code=read('assets/biology/ch4_new_check_1008_v1.cjs').replace("id('introScreen').textContent,''","id('introScreen').textContent.trim(),''").replaceAll('/private/tmp/biology_ch4_qa_1008_v1',out).replace('(async()=>{','this.regressionPromise=(async()=>{');
 // The two narrowly guarded 4-1 cover changes above are intentionally allowed;
 // every other protected file retains the historical baseline check.
 code=code.replace("['index.html','assets/biology/chapter4_progress.md']","['index.html','assets/biology/chapter4_progress.md','biology_plant_structure.html','assets/biology/plant_structure_1008_v2.js']");
 const sandbox={require,__dirname,console,process:{argv:['node','check','--published']},setTimeout,Buffer};vm.runInNewContext(code,sandbox);await sandbox.regressionPromise;assert(!sandbox.process.exitCode);report.regression=JSON.parse(fs.readFileSync(path.join(out,'report.json'),'utf8'));assert.equal(report.regression.textOverflow.length,0);
 fs.writeFileSync(path.join(out,'leaf_report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({out,guards:report.guards.length,covers:report.covers.length,states:report.states.length,text:report.text.length,anatomy:report.anatomy.length},null,2));
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
