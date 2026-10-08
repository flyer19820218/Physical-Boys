/* Native Canvas/event simulation, not a browser or physical-iPad layout check. */
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert'),crypto=require('crypto'),cp=require('child_process');
const base=path.resolve(__dirname,'../..'),read=f=>fs.readFileSync(path.join(base,f),'utf8');
const baseline='6d78d7d5f466a8f0413e35ffb7337f2a619dfa7e';
const before=f=>cp.execFileSync('git',['show',baseline+':'+f],{cwd:base,maxBuffer:32*1024*1024}).toString();
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const out='/private/tmp/biology_root_area_1009_v2';fs.mkdirSync(out,{recursive:true});
const report={baseline,verification:'Native Canvas with real fonts and simulated DOM/events; browser/iPad not verified',guards:[],states:[],textBounds:[],visibility:[],crossings:[],hits:[]};
function section(code,a,b){const start=code.indexOf(a),end=code.indexOf(b,start+a.length);assert(start>=0&&end>start);return code.slice(start,end);}
const file='assets/biology/plant_transport_1008_v1.js',moduleSource=read(file),previous=before(file);
let normalized=moduleSource.replace(section(moduleSource,'// The cell body and hair','function transpire'),section(previous,'function rootModel','function transpire'));
normalized=normalized.replace(section(normalized," {id:'rootHair'"," {id:'transpiration'"),section(previous," {id:'rootHair'"," {id:'transpiration'"));
assert.equal(normalized,previous,'No source change outside authorized root-hair drawing and tab');
report.guards.push({file,protected:'All other drawings, numerical geometry, trajectories, instructions, formulas and tab order are byte-identical',hash:hash(normalized)});
const cellPath=section(moduleSource,' function cell(', ' for(let row=0;row<5;row++)');
assert.equal(cellPath,section(previous,' function cell(', ' for(let row=0;row<5;row++)'),'The intact epidermal cell/hair path and all its numerical geometry are unchanged');
report.guards.push({file,protected:'Intact cell/hair contour, gradient, nucleus and numerical geometry unchanged',hash:hash(cellPath)});
for(const f of ['assets/biology/living_book_1008_v1.js','assets/biology/living_book_1008_v1.css','assets/biology/ch4_refinement_1009_v1.css','assets/biology/ch4_cinematic_cover_1009_v1.css','assets/biology/ch4_cinematic_cover_1009_v1.js','assets/biology/human_transport_1008_v1.js','assets/biology/immune_defense_1008_v1.js','biology_human_transport.html','biology_immune_defense.html']){
 assert.equal(read(f),before(f),f+' unchanged');report.guards.push({file:f,hash:hash(read(f))});
}
const html=read('biology_plant_transport.html');
assert.equal(html.replace(/^ +<p><a href="https:\/\/(?:openstax\.org\/books\/biology\/pages\/30-3-roots|www\.scfc\.gov\/)[^\n]+\n/gm,'').replace('20261009-rootarea2','20261009-refinement1'),before('biology_plant_transport.html'));
let prefix=read('assets/biology/chapter1_compact_check_1008_v1.cjs').split('function normalize(html)')[0];
const harness={require,__dirname,console,setTimeout};vm.runInNewContext(prefix+'\nthis.environment=environment;',harness);
const E=harness.environment(html);E.context.Date=class extends Date{static now(){return E.now();}};
E.run(read('assets/biology/living_book_1008_v1.js'),'unchanged lesson shell');E.run(moduleSource.replace('B.register({','B.__rootSites=rootSurfaceSites; B.register({'),'root-area revision');
const B=E.context.LivingBook,canvas=E.document.getElementById('lessonCanvas'),c=canvas.getContext('2d');
function pixels(){return c.getImageData(0,0,960,600).data;}
function setState(values){Object.assign(B.getState(),{elapsed:1.4,running:false,...values});B.draw();}
function textAudit(name){
 const raw=c.fillText.bind(c),texts=[],originalD=B.D.text;
 B.D.text=function(ctx,p,x,y,o={}){
  const str=B.D.tr(p);let size=o.size||24;ctx.save();ctx.font=`700 ${size}px "Noto Sans TC", "JetBrains Mono"`;
  while(o.max&&size>22&&ctx.measureText(str).width>o.max)ctx.font=`700 ${--size}px "Noto Sans TC", "JetBrains Mono"`;
  const width=ctx.measureText(str).width;ctx.restore();
  report.textBounds.push({name,text:str,size,width,max:o.max});
  return originalD(ctx,p,x,y,o);
 };
 let serial=0;const intents=[];
 c.fillText=function(str,x,y,max){
  const a=new Uint8ClampedArray(pixels());raw(str,x,y,max);const b=pixels(),columns=new Set();
  for(let yy=0;yy<600;yy++)for(let xx=0;xx<960;xx++){const k=(yy*960+xx)*4;if(a[k]!==b[k]||a[k+1]!==b[k+1]||a[k+2]!==b[k+2])columns.add(xx);}
  texts.push({str,x,y,font:this.font});intents.push(columns);serial++;
 };
 B.draw();const full=new Uint8ClampedArray(pixels());c.fillText=raw;B.D.text=originalD;
 for(let omit=0;omit<texts.length;omit++){
  let index=0;c.fillText=function(str,x,y,max){if(index++!==omit)raw(str,x,y,max);};B.draw();const skipped=pixels();
  let run=0,maxInvisibleRun=0,visible=0,intended=intents[omit].size;
  for(const xx of [...intents[omit]].sort((a,b)=>a-b)){
   let seen=false;for(let yy=0;yy<600;yy++){const k=(yy*960+xx)*4;if(full[k]!==skipped[k]||full[k+1]!==skipped[k+1]||full[k+2]!==skipped[k+2]){seen=true;break;}}
   if(seen){visible++;run=0;}else{run++;maxInvisibleRun=Math.max(maxInvisibleRun,run);}
  }
  report.visibility.push({name,...texts[omit],intendedColumns:intended,visibleColumns:visible,maxInvisibleRun});
  assert(visible>0&&maxInvisibleRun<4,name+': hidden text '+texts[omit].str);
 }
 c.fillText=raw;B.draw();
}
function save(name){fs.writeFileSync(path.join(out,name+'.png'),canvas.canvas.toBuffer('image/png'));}
(async()=>{
 new vm.Script(moduleSource);
 E.document.getElementById('introScreen').click();B.setTab(1);await new Promise(r=>setTimeout(r,100));
 assert.equal(E.document.documentElement.lang,'zh-Hant');assert.equal(canvas.width,960);assert.equal(canvas.height,600);assert.equal(E.queue.size,1);
 for(const lang of ['zh','en'])for(const view of ['surface','transplant']){
  B.setLanguage(lang);B.action('view',view);
  const states=view==='surface'?['intact','damaged']:['before','after','lessLeaf'];
  for(const value of states)for(const soil of (view==='surface'?['fresh','salty']:['fresh'])){
   setState({soil,[view==='surface'?'hairs':'compare']:value});
   const name=[view,value,soil,lang].join('_');textAudit(name);save(name);
   B.getState().running=true;E.advance();const start=hash(pixels());for(let j=0;j<60;j++)E.advance();assert.notEqual(hash(pixels()),start,'1s motion: '+name);
   B.getState().running=false;E.advance();const frozen=hash(pixels());for(let j=0;j<60;j++)E.advance();assert.equal(hash(pixels()),frozen,'Pause: '+name);
   report.states.push({name,oneSecondMotion:true,pausePixelIdentity:true,check:JSON.parse(JSON.stringify(B.getTab().check(B.getState())))});
  }
 }
 // Record actual water centres over a full cycle, not just self-reported flags.
 B.action('view','surface');B.action('hairs','intact');
 const originalWater=B.D.water,traces=Array.from({length:30},()=>[]);let waterIndex=0,recording=false;
 B.D.water=function(ctx,x,y,size){if(recording)traces[waterIndex++].push({x,y});originalWater(ctx,x,y,size);};
 for(const soil of ['fresh','salty']){
  B.action('soil',soil);traces.forEach(a=>a.length=0);
  recording=true;for(let frame=0;frame<120;frame++){waterIndex=0;B.getState().elapsed=frame/30;B.draw();}recording=false;
  const geometry=B.__rootSites(false),crossed=traces.every((a,i)=>{
   const site=geometry[i],d=a.map(p=>(p.x-site.x)*site.nx+(p.y-site.y)*site.ny);
   assert(Math.min(...d)<-8&&Math.max(...d)>18,'The molecule centre really crosses the membrane');
   const delta=d[1]-d[0];assert(soil==='fresh'?delta<0:delta>0,'Net direction matches the selected solution');return true;
  });
  assert(traces.every(a=>a.length===120));report.crossings.push({soil,sites:traces.length,allSitesCross:crossed,allSitesMove:traces.every(a=>Math.hypot(a[1].x-a[0].x,a[1].y-a[0].y)>0)});
  assert(report.crossings.at(-1).allSitesMove);
 }
 B.D.water=originalWater;
 B.action('hairs','damaged');assert.equal(B.getTab().check(B.getState()).surfaceSites,3,'Remaining epidermis still takes up water');
 B.action('hairs','intact');assert.equal(B.getTab().check(B.getState()).surfaceSites,30);assert.deepEqual(Array.from(B.getTab().check(B.getState()).entryRegions),['epidermis','upper','lower','tip']);
 for(const [y,value] of [[410,'intact'],[495,'damaged']]){
  const rect=canvas.getBoundingClientRect(),x=155*rect.width/960,clientY=y*rect.height/600;
  canvas.dispatchEvent(new E.Ev('pointerdown',{pointerId:1,clientX:x,clientY}));
  canvas.dispatchEvent(new E.Ev('pointerup',{pointerId:1,clientX:x,clientY}));assert.equal(B.getState().hairs,value);
  report.hits.push(value);
 }
 B.action('view','transplant');
 assert.equal(B.getState().soil,'fresh','Transplant comparison holds ordinary soil solution constant');
 for(const [i,value] of ['before','after','lessLeaf'].entries()){
  const rect=canvas.getBoundingClientRect(),x=rect.left+(20+i*313+147)*rect.width/960,y=rect.top+75*rect.height/600;
  canvas.dispatchEvent(new E.Ev('pointerdown',{pointerId:1,clientX:x,clientY:y}));
  canvas.dispatchEvent(new E.Ev('pointerup',{pointerId:1,clientX:x,clientY:y}));
  assert.equal(B.getState().compare,value,'Tap chooses scenario, not a function-valued key');report.hits.push(value);
 }
 const caution=B.getTab().explain(B.getState()).text;
 assert(caution[0].includes('不是所有植物')&&caution[0].includes('製造根部恢復'));
 assert(read('assets/biology/living_book_1008_v1.css').includes('max-width:1080px'));
 // Full 16-tab regression with the original test harness; no local browser bypass.
 let regression=read('assets/biology/ch4_new_check_1008_v1.cjs').replace("id('introScreen').textContent,''","id('introScreen').textContent.trim(),''")
  .replaceAll('/private/tmp/biology_ch4_qa_1008_v1',out).replace('(async()=>{','this.regressionPromise=(async()=>{');
 const sandbox={require,__dirname,console,process:{argv:['node','check','--published']},setTimeout,Buffer};vm.runInNewContext(regression,sandbox);await sandbox.regressionPromise;assert(!sandbox.process.exitCode);
 report.regression=JSON.parse(fs.readFileSync(path.join(out,'report.json'),'utf8'));assert.equal(report.regression.textOverflow.length,0);
 const tooWide=report.textBounds.filter(q=>q.max&&q.width>q.max+.5);
 fs.writeFileSync(path.join(out,'root_area_report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({guards:report.guards.length,rootStates:report.states.length,fonts:[...new Set(report.textBounds.map(p=>p.size))],textVisibility:report.visibility.length,tooWide,crossings:report.crossings,hits:report.hits,out},null,2));
 assert.equal(tooWide.length,0,'All labels must fit their declared safe width');
})().catch(e=>{console.error(e.stack);fs.writeFileSync(path.join(out,'failure.json'),JSON.stringify(report,null,2));process.exitCode=1;});
