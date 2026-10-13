/* Header-only regression: simulated DOM and native Canvas, not browser layout. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),cp=require('node:child_process'),crypto=require('node:crypto');
const repo=path.resolve(__dirname,'../..'),read=f=>fs.readFileSync(path.join(repo,f),'utf8');
const baseline='de30477b86292c8e486a4d4596af3aaf2183d567';
const before=f=>cp.execFileSync('git',['show',baseline+':'+f],{cwd:repo,encoding:'utf8'});
const oldHeader="el('eyebrow').textContent=tr(['生物的運輸與防禦 · '+unit.section,'Transport and defence · '+unit.section]);";
const shell=read('assets/biology/living_book_1008_v1.js');
assert.equal(shell.replace("el('eyebrow').textContent='';",oldHeader),before('assets/biology/living_book_1008_v1.js'),'Only header text changes in the shared shell; every drawing, coordinate, timer and event handler is identical');
for(const file of ['assets/biology/plant_structure_1008_v2.js','assets/biology/plant_structure_models_1008_v2.js','assets/biology/plant_structure_layout_1008_v4.js','assets/biology/plant_transport_1008_v1.js','assets/biology/immune_defense_1008_v1.js','assets/biology/human_transport_1008_v1.js','assets/biology/human_transport_cutaways_1012_v1.js','assets/biology/human_transport_exchanges_1013_v1.js'])assert.equal(read(file),before(file),'Protected module remains byte-identical: '+file);
for(const kind of ['plant_structure','plant_transport','human_transport','immune_defense']){
  const html=read('biology_'+kind+'.html');
  assert(!/4[-－–][1-4]|第四單元/.test(html),'Student-facing HTML has no chapter numbers: '+kind);
  assert(!/<title>\s*\d/.test(html));
}
const prefix=read('assets/biology/chapter3_compact_check_1008_v1.cjs').split('\nfunction normalize(html)')[0];
const harness={require,__dirname,console,setTimeout};vm.runInNewContext(prefix+'\nthis.environment=harness.environment;',harness);
const digest=c=>crypto.createHash('sha256').update(c.getContext('2d').getImageData(0,0,960,600).data).digest('hex');
async function main(){
  let scenes=0,moving=0;
  for(const kind of ['plant_transport','human_transport','immune_defense']){
    const html=read('biology_'+kind+'.html'),E=harness.environment(html),d=E.document;
    for(const m of html.matchAll(/<script\b[^>]*src="([^"?]+)[^"]*"[^>]*><\/script>/g)){
      if(m[1].includes('ch4_cinematic_cover'))continue;
      E.run(read(m[1]),m[1]);
    }
    await new Promise(r=>setTimeout(r,100));
    const B=E.context.LivingBook,tabs=Object.values(B.modules)[0].tabs,c=d.getElementById('lessonCanvas');
    d.getElementById('introScreen').click();
    for(let i=0;i<tabs.length;i++)for(const lang of ['zh','en']){
      B.setTab(i);B.setLanguage(lang);const eyebrow=d.getElementById('eyebrow');
      assert.equal(eyebrow.textContent,'','Switching tabs/languages cannot regenerate chapter numbers');assert(eyebrow.hidden);
      for(const element of [d.getElementById('title'),d.getElementById('subtitle'),...d.querySelectorAll('.chapter-nav a')])assert(!/\d[-－–]\d/.test(element.textContent));
      assert(d.getElementById('title').textContent);assert(d.getElementById('subtitle').textContent);scenes++;
      const tab=B.getTab();
      if(kind==='immune_defense')B.action('view','model');
      if(kind==='plant_transport'&&tab.id==='celeryLab'){B.action('action','restart');B.action('prediction','xylem');for(let n=0;n<3;n++)B.action('action','next');}
      if(kind==='immune_defense'&&tab.id==='antibody'){B.action('antigen',0);B.action('antibody',0);B.action('dockAction','bind');}
      B.getState().running=true;E.advance();B.draw();const a=digest(c);for(let n=0;n<60;n++)E.advance();B.draw();
      if(!tab.static){assert.notEqual(digest(c),a,kind+'/'+tab.id+'/'+lang+' still moves');moving++;}
    }
  }
  console.log(JSON.stringify({scenes,moving,sharedShellOnlyHeaderTextChanged:true,protectedDrawingModules:8,chapterNumbersAbsentInFourLessons:true},null,2));
}
main().catch(e=>{console.error(e.stack);process.exitCode=1;});
