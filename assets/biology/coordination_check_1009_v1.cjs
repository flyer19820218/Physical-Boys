/* Real-font native Canvas plus simulated DOM. Does NOT validate browser CSS or hardware iPad. */
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert'),crypto=require('crypto'),cp=require('child_process');
const base=path.resolve(__dirname,'../..'),read=f=>fs.readFileSync(path.join(base,f),'utf8'),hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const out='/private/tmp/biology_coordination_1009_v1/qa';fs.mkdirSync(out,{recursive:true});
const report={scope:'Native Canvas real fonts and simulated DOM/events; browser compositor, getComputedStyle and physical iPad unverified.',units:[],bounds:[],text:[],visibility:[],frames:[],guards:[],layouts:[],coverChecks:[]};
let prefix=read('assets/biology/chapter1_compact_check_1008_v1.cjs').split('function normalize(html)')[0];
prefix=prefix.replace('addEventListener(n,fn){','removeEventListener(n,fn){this.events[n]=(this.events[n]||[]).filter(f=>f!==fn);}blur(){if(document.activeElement===this)document.activeElement=document.body;}addEventListener(n,fn){').replace('addEventListener:(n,f)=>(events[n]??=[]).push(f)};', 'addEventListener:(n,f)=>(events[n]??=[]).push(f),removeEventListener:(n,f)=>{events[n]=(events[n]||[]).filter(q=>q!==f);}};');
const harness={require,__dirname,console,setTimeout};vm.runInNewContext(prefix+'\nthis.environment=environment;',harness);
const units=['nervous_signals','brain_reflex','endocrine','responses'];
function env(kind,{enter=true,reduced=true}={}){const E=harness.environment(read('biology_'+kind+'.html')),timers=new Map();let serial=0;E.context.setTimeout=(fn,ms)=>{timers.set(++serial,{fn,ms});return serial;};E.context.clearTimeout=id=>timers.delete(id);E.context.matchMedia=()=>({matches:reduced});
 for(const f of ['ch4_cinematic_cover_1009_v1','coordination_book_1009_v1','coordination_models_1009_v1',kind+'_1009_v1'])E.run(read('assets/biology/'+f+'.js'),f);
 const screen=E.document.getElementById('introScreen'),pic=screen.querySelector('.cover-image');if(enter){pic.complete=true;pic.naturalWidth=1672;pic.dispatchEvent(new E.Ev('load'));screen.click();assert(screen.hidden);assert(!E.document.querySelector('main').inert);}return Object.assign(E,{B:E.context.LivingBook,timers,screen,pic});
}
function bounds(B,c,name){const raw=c.fillText.bind(c);c.fillText=function(str,x,y,max){const m=this.measureText(str),w=m.width,left=this.textAlign==='center'?x-w/2:this.textAlign==='right'?x-w:x,top=y-m.actualBoundingBoxAscent,bottom=y+m.actualBoundingBoxDescent;report.bounds.push({name,str,left,right:left+w,top,bottom,font:this.font});assert(left>=0&&left+w<=960.5&&top>=0&&bottom<=600.5,name+' out-of-canvas text: '+str);raw(str,x,y,max);};B.draw();c.fillText=raw;}
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

function coverChecks(){
 for(const kind of units){
  const E=env(kind,{enter:false,reduced:false});assert.equal(E.screen.textContent.trim(),'');assert(E.document.querySelector('main').inert);assert.equal(E.document.querySelectorAll('.floating-lang-container').length,1);
  for(let i=0;i<12;i++)E.advance(100);assert.equal(E.B.getState().elapsed,0);
  E.pic.complete=true;E.pic.naturalWidth=1672;E.pic.dispatchEvent(new E.Ev('load'));assert(E.screen.classList.contains('cover-ready'));
  E.screen.click();E.screen.click();assert(!E.screen.hidden);assert.equal(E.timers.size,1);E.screen.dispatchEvent(new E.Ev('transitionend',{propertyName:'opacity'}));assert(E.screen.hidden);assert(!E.document.querySelector('main').inert);assert.equal(E.timers.size,0);
  const F=env(kind,{enter:false,reduced:false});F.emit('keydown',{key:'Escape'});for(const [id,t]of F.timers){F.timers.delete(id);t.fn();}assert(F.screen.hidden);
  const R=env(kind,{enter:false});R.screen.click();assert(R.screen.hidden);
  report.coverChecks.push({kind,wordless:true,oneLanguageSwitcher:true,lessonClockStopped:true,doubleTapOneFade:true,escapeAndFallback:true,reducedMotion:true});
 }
}
async function main(){coverChecks();
 for(const f of ['assets/biology/living_book_1008_v1.js','assets/biology/living_book_1008_v1.css','assets/biology/ch4_cinematic_cover_1009_v1.js','assets/biology/ch4_cinematic_cover_1009_v1.css','assets/biology/ch4_refinement_1009_v1.css','assets/biology/plant_transport_1008_v1.js','assets/biology/human_transport_1008_v1.js','assets/biology/immune_defense_1008_v1.js','biology_plant_transport.html','biology_human_transport.html','biology_immune_defense.html','assets/biology/plant_structure_models_1008_v2.js','assets/biology/plant_structure_layout_1008_v4.js','assets/biology/plant_structure_1008_v4.css']){const old=cp.execFileSync('git',['show','f8282a8:'+f],{cwd:base});assert.equal(hash(old),hash(read(f)));report.guards.push(f);}
 for(const kind of units){const E=env(kind),B=E.B,id=n=>E.document.getElementById(n),canvas=id('lessonCanvas'),c=canvas.getContext('2d');await new Promise(r=>setTimeout(r,130));E.advance();
  const entry={kind,tabs:[],actions:0,fullscreenExit:true,wordlessCover:true};const spec=Object.values(B.modules)[0];
  for(let i=0;i<spec.tabs.length;i++){B.setTab(i);const tab=B.getTab();assert(tab.title[0]&&tab.title[1]&&tab.hook[0]&&tab.hook[1]&&tab.body[0]&&tab.body[1]&&tab.closure[0]&&tab.closure[1],kind+'/'+tab.id+' complete bilingual teaching text');
   const variations=[...tab.controls(B.getState()).flatMap(g=>g.items).filter(x=>!x.input).map(q=>[q.key,q.value])];
   for(const lang of ['zh','en']){id('resetButton').click();B.setLanguage(lang);await new Promise(r=>setTimeout(r,60));assert(id('title').textContent.length>0);assert(!/\b[45]-\d|第[一二三四五六七八九十\d]+[章節單元]/.test(id('title').textContent+id('eyebrow').textContent+id('lessonTabs').textContent));
    B.getState().elapsed=1.3;B.draw();bounds(B,c,kind+'/'+tab.id+'/'+lang);audit(B,c,kind+'/'+tab.id+'/'+lang);
    const file=kind+'_'+tab.id+'_'+lang+'.png';fs.writeFileSync(path.join(out,file),canvas.canvas.toBuffer('image/png'));report.frames.push(file);
    for(const [key,value] of variations){B.action(key,value);await new Promise(r=>setTimeout(r,8));bounds(B,c,kind+'/'+tab.id+'/'+lang+'/'+key+'='+value);entry.actions++;assert(id('captionText').textContent.length>20);}
    B.setFull(true);assert(id('bench').classList.contains('expanded'));id('fullButton').click();assert(!id('bench').classList.contains('expanded'));B.setFull(true);E.emit('keydown',{key:'Escape'});assert(!id('bench').classList.contains('expanded'));
   }
   B.setLanguage('zh');id('resetButton').click();await new Promise(r=>setTimeout(r,15));B.getState().elapsed=.3;if(tab.id==='knee')B.action('tap',true);if(tab.id==='nastic')B.action('closed',true);if(tab.id==='pupil')B.action('bright',true);if(tab.id==='adaptation')B.action('transfer',true);B.draw();
   const start=hash(c.getImageData(0,0,960,600).data);E.advance();for(let f=0;f<60;f++)E.advance();const moving=hash(c.getImageData(0,0,960,600).data)!==start;
   if(!['reaction','boxes','animal'].includes(tab.id))assert(moving,kind+'/'+tab.id+' actual one-second pixel motion');
   if(!tab.noPause){B.getState().running=false;B.draw();const stop=hash(c.getImageData(0,0,960,600).data);for(let f=0;f<60;f++)E.advance();assert.equal(hash(c.getImageData(0,0,960,600).data),stop);B.getState().running=true;}
   if(tab.record){id('recordInput').value='測試觀察';id('recordInput').dispatchEvent(new E.Ev('input'));B.setLanguage('en');assert.equal(id('recordInput').value,'測試觀察');B.setLanguage('zh');}
   if(tab.id==='gravity'){B.action('stage','initial');B.draw();const initial=hash(c.getImageData(0,0,960,600).data);B.action('stage','later');assert.notEqual(hash(c.getImageData(0,0,960,600).data),initial);entry.gravityStageChangesDiagram=true;}
   B.setLanguage('en');id('resetButton').click();B.getState().elapsed=.3;if(tab.id==='knee')B.action('tap',true);if(tab.id==='nastic')B.action('closed',true);if(tab.id==='pupil')B.action('bright',true);if(tab.id==='adaptation')B.action('transfer',true);B.draw();const enStart=hash(c.getImageData(0,0,960,600).data);E.advance();for(let f=0;f<60;f++)E.advance();const enMoving=hash(c.getImageData(0,0,960,600).data)!==enStart;if(!['reaction','boxes','animal'].includes(tab.id))assert(enMoving,kind+'/'+tab.id+' EN one-second motion');
   entry.tabs.push({id:tab.id,oneSecondMotion:moving,englishOneSecondMotion:enMoving,manualObservationOnly:['reaction','boxes','animal'].includes(tab.id)});
  }
  if(kind==='nervous_signals'){B.setTab(3);id('resetButton').click();B.action('start',true);B.action('respond',true);assert.equal(B.getState().phase,'early');assert.equal(B.getState().scores.length,0);for(let trial=0;trial<6;trial++){B.action('start',true);for(let f=0;f<50&&B.getState().phase==='wait';f++)E.advance(100);assert.equal(B.getState().phase,'go');E.advance(230);B.action('respond',true);assert.equal(B.getState().response,230);}assert.equal(B.getState().scores.length,5);B.action('start',true);B.setTab(0);B.setTab(3);assert.equal(B.getState().phase,'idle');entry.reactionFalseStartExcluded=true;entry.monotonicClock230ms=true;entry.lastFiveTrials=true;entry.tabSwitchCancels=true;B.action('start',true);E.document.hidden=true;E.emit('visibilitychange',{});assert.equal(B.getState().phase,'idle');E.document.hidden=false;E.emit('visibilitychange',{});entry.visibilityCancels=true;}
  report.units.push(entry);
 }
 // Formula-only fullscreen space check, not a physical pointer/compositor check.
 for(const [w,h]of [[1366,1024],[1024,1366],[1194,834],[834,1194],[1180,820],[820,1180],[1024,768],[768,1024],[1133,744],[744,1133]]){const portrait=w<=h,left=portrait?20:280,available=w-left-20,mediaH=h-(portrait?390:280),cw=Math.min(available,Math.max(100,mediaH)*1.6);assert(cw<=available);report.layouts.push({w,h,canvasWidth:cw,leftControlWidth:portrait?0:244,formulaOnly:true});}
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({out,units:report.units,bounds:report.bounds.length,visibleText:report.visibility.length,covers:report.coverChecks.length,guards:report.guards.length,layouts:report.layouts.length},null,2));
}
main().catch(e=>{console.error(e.stack);process.exitCode=1;});
