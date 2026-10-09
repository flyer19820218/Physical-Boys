/* Native Canvas + simulated DOM tests. Not a browser/iPad CSS verification. */
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert'),crypto=require('crypto'),cp=require('child_process');
const base=path.resolve(__dirname,'../..'),read=f=>fs.readFileSync(path.join(base,f),'utf8');
const baseline='14bee720d711666ad25c22e0ee6c6dc3e0cd87b1';
const before=f=>cp.execFileSync('git',['show',baseline+':'+f],{cwd:base,maxBuffer:32*1024*1024});
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const out='/private/tmp/biology_right_exit_1009_v4';fs.mkdirSync(out,{recursive:true});
const report={baseline,scope:'Native Canvas with real fonts and simulated DOM/events; browser compositor and physical iPad unverified.',guards:[],covers:[],states:[],text:[],visibility:[],anatomy:[],frames:[],rightEnd:[]};
function slice(code,a,b){const start=code.indexOf(a),end=code.indexOf(b,start+a.length);assert(start>=0&&end>start);return code.slice(start,end);}
function same(file,actual){assert.equal(actual,before(file).toString(),file+' protected source');report.guards.push({file,byteIdenticalExceptAuthorizedEdits:true,sha256:hash(actual)});}
const file='assets/biology/plant_transport_1008_v1.js',plant=read(file),oldPlant=before(file).toString();
let normalized=plant.replace(slice(plant,'function transpire','const labText='),slice(oldPlant,'function transpire','const labText='));
const row=code=>code.split('\n').find(s=>s.startsWith(" {id:'transpiration'"));
same(file,normalized.replace(row(normalized),row(oldPlant)));
same('biology_plant_transport.html',read('biology_plant_transport.html').replace('plant_transport_1008_v1.js?v=20261009-exit4','plant_transport_1008_v1.js?v=20261009-leaf3'));
for(const f of ['assets/biology/living_book_1008_v1.js','assets/biology/living_book_1008_v1.css','assets/biology/ch4_cinematic_cover_1009_v1.js','assets/biology/ch4_cinematic_cover_1009_v1.css','assets/biology/ch4_refinement_1009_v1.css','assets/biology/human_transport_1008_v1.js','assets/biology/immune_defense_1008_v1.js','assets/biology/plant_structure_models_1008_v2.js','assets/biology/plant_structure_layout_1008_v4.js','assets/biology/plant_structure_1008_v4.css','assets/biology/plant_structure_1008_v2.js','biology_plant_structure.html','biology_human_transport.html','biology_immune_defense.html'])same(f,read(f));
for(const f of ['assets/biology/ch4_plant_structure_1008_v1/plant_atlas_native2.png','assets/biology/ch4_new_1008_v1/stoma_open.png','assets/biology/ch4_new_1008_v1/stoma_closed.png']){
 assert.equal(hash(fs.readFileSync(path.join(base,f))),hash(before(f)));report.guards.push({file:f,originalBitmapUnchanged:true,sha256:hash(before(f))});
}
// Reuse the reviewed real-font rendering/event harness, keeping its historic file unchanged.
const previous=read('assets/biology/leaf_vein_check_1009_v3.cjs');
const helper=previous.slice(previous.indexOf('let prefix='),previous.indexOf('(async()=>{'));
const structure=read('assets/biology/plant_structure_1008_v2.js');
const sandbox={require,__dirname,console,setTimeout,read,vm,assert,report,path,out,fs,hash,structure};
vm.runInNewContext(helper+'\nthis.helpers={env,enter,covers,figures};',sandbox);
async function rightEnd(){
 const E=sandbox.helpers.env('plant_transport',true);sandbox.helpers.enter(E);const B=E.B;B.setTab(2);
 const water=B.D.water,line=B.D.line;let centres=[],walls=[];
 B.D.water=(ctx,x,y,size)=>{centres.push({x,y,size});return water(ctx,x,y,size);};
 B.D.line=(ctx,p,...a)=>{walls.push(p);return line(ctx,p,...a);};
 for(const condition of ['baseline','wind','humid','drought']){
  B.action('condition',condition);B.getState().running=false;
  const rate={baseline:1,wind:1.6,humid:.5,drought:.2}[condition];let previousLiquid=null,crossedEnd=false,crossedStoma=false;
  for(let step=1;step<100;step++){
   centres=[];walls=[];B.getState().elapsed=step/100/(rate*.32);B.draw();
   assert.equal(centres.length,condition==='drought'?7:10);
   const liquid=centres.slice(0,7),vapour=centres.slice(7);
   assert(liquid.every(p=>p.y>=298-1e-6),'No upward liquid diversion');
   assert(liquid.filter(p=>p.x<=728).every(p=>Math.abs(p.y-298)<1e-6),'Every centre inside xylem stays horizontal');
   if(previousLiquid)liquid.forEach((p,i)=>assert(p.x>=previousLiquid[i].x-1e-6,'Liquid travels right, not backward'));
   crossedEnd ||= liquid.some(p=>p.x>728&&p.x<790);
   assert(vapour.every(p=>p.x>=790-1e-6&&p.y>=329-1e-6),'Evaporation starts at the right mesophyll cell');
   for(const p of vapour.filter(p=>p.y>=422&&p.y<=456)){assert(Math.abs(p.x-836)<1e-6,'Vapour crosses the real lower-right stoma');crossedStoma=true;}
   assert(walls.some(p=>p.length===2&&p[0][0]===351&&p[0][1]===269&&p[1][0]===728&&p[1][1]===269),'Upper xylem wall has no false upward notch');
   previousLiquid=liquid;
  }
  assert(crossedEnd);assert.equal(crossedStoma,condition!=='drought');
  report.rightEnd.push({condition,sampledFrames:99,rightwardLiquid:true,noUpwardNotch:true,crossesRightEnd:true,vapourThroughStoma:crossedStoma});
 }
 B.D.water=water;B.D.line=line;
}
(async()=>{
 new vm.Script(plant,{filename:file});
 await sandbox.helpers.covers();await sandbox.helpers.figures();await rightEnd();
 let regression=read('assets/biology/ch4_new_check_1008_v1.cjs').replace("id('introScreen').textContent,''","id('introScreen').textContent.trim(),''").replaceAll('/private/tmp/biology_ch4_qa_1008_v1',out).replace('(async()=>{','this.regressionPromise=(async()=>{');
 regression=regression.replace("['index.html','assets/biology/chapter4_progress.md']","['index.html','assets/biology/chapter4_progress.md','biology_plant_structure.html','assets/biology/plant_structure_1008_v2.js']");
 const run={require,__dirname,console,process:{argv:['node','check','--published']},setTimeout,Buffer};vm.runInNewContext(regression,run);await run.regressionPromise;assert(!run.process.exitCode);
 report.regression=JSON.parse(fs.readFileSync(path.join(out,'report.json'),'utf8'));assert.equal(report.regression.textOverflow.length,0);
 fs.writeFileSync(path.join(out,'right_exit_report.json'),JSON.stringify(report,null,2));
 console.log(JSON.stringify({out,guards:report.guards.length,covers:report.covers.length,states:report.states.length,text:report.text.length,rightEnd:report.rightEnd},null,2));
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
