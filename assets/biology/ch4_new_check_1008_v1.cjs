/* Native Canvas + DOM/event simulation. Not a browser or physical-iPad check. */
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert'),crypto=require('crypto');
const {createCanvas,loadImage}=require('/Users/lvyanjun/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@napi-rs/canvas');
const base=path.resolve(__dirname,'../..'),read=f=>fs.readFileSync(path.join(base,f),'utf8');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const prefix=read('assets/biology/chapter3_compact_check_1008_v1.cjs').split('\nfunction normalize(html)')[0];
const harness={require,__dirname,console,setTimeout};vm.runInNewContext(prefix+'\nthis.environment=harness.environment;',harness);
const out='/private/tmp/biology_ch4_qa_1008_v1';fs.mkdirSync(out,{recursive:true});
const report={scope:'New 4-2/4-3/4-4 only',verification:'Native Canvas, real Noto/JetBrains fonts, DOM/event simulation; browser CSS and physical iPad not verified',units:[],textOverflow:[],protectedFiles:{}};
const shots=[];
const publication=process.argv.includes('--published');
function textAudit(ctx,key){const original=ctx.fillText.bind(ctx);ctx.fillText=function(text,x,y,max){const m=this.measureText(String(text)),left=x-(this.textAlign==='center'?m.width/2:this.textAlign==='right'||this.textAlign==='end'?m.width:0);if(left<-.5||left+m.width>960.5||y>600.5||y<0)report.textOverflow.push({key,text,x,y,width:m.width,left,font:this.font});return original(text,x,y,max);};}
async function unit(kind){
 const file=publication?`biology_${kind}.html`:`biology_${kind}_living_book_preview_1008_v1.html`,html=read(file),E=harness.environment(html),d=E.document,id=n=>d.getElementById(n);
 E.context.Date=class extends Date{static now(){return E.now();}};
 E.run(read('assets/biology/living_book_1008_v1.js'),'new living-book shell');E.run(read(`assets/biology/${kind}_1008_v1.js`),kind);
 await new Promise(r=>setTimeout(r,70));const B=E.context.LivingBook,spec=Object.values(B.modules)[0],canvas=id('lessonCanvas'),ctx=canvas.getContext('2d');
 assert.equal(d.documentElement.lang,'zh-Hant');assert.equal(d.querySelectorAll('[data-lang]').length,2);assert.equal(E.queue.size,1,'Exactly one animation clock');assert.equal(canvas.width,960);assert.equal(canvas.height,600);assert.equal(id('introScreen').textContent,'','Wordless cover');
 id('introScreen').click();assert(id('introScreen').hidden);assert(fs.existsSync(path.join(base,spec.cover)),'Cover file exists');
 const r={section:spec.section,file,tabs:[],actions:0,pauseTests:0,fullscreenTests:0,oneRaf:true};report.units.push(r);
 for(const [i,tab] of spec.tabs.entries()){
  for(const code of ['zh','en']){
   B.setTab(i);B.setLanguage(code);id('resetButton').click();await new Promise(r=>setTimeout(r,10));B.draw();
   assert.equal(d.documentElement.lang,code==='zh'?'zh-Hant':'en');assert(id('captionTitle').textContent&&id('captionText').textContent,'Caption present');assert.equal(id('captionText').closest('.caption'),id('captionTitle').closest('.caption'));assert.equal(id('controls').querySelector('canvas'),null);
   B.setFull(true);assert(id('bench').classList.contains('expanded'));assert(id('bench').style.getPropertyValue('--media-h'));B.setLanguage(code==='zh'?'en':'zh');assert(id('bench').classList.contains('expanded'));id('fullButton').click();assert(!id('bench').classList.contains('expanded'));assert(!d.body.classList.contains('has-expanded'));B.setLanguage(code);B.setFull(true);E.emit('keydown',{key:'Escape'});assert(!id('bench').classList.contains('expanded'));r.fullscreenTests+=2;
   const items=tab.controls(B.getState()).flatMap(g=>g.items);
   for(const item of items){if(item.disabled)continue;B.action(item.key,item.value);B.draw();r.actions++;assert(id('captionText').textContent,'Action retains explanation');if(tab.check)assert(tab.check(B.getState()));}
   id('resetButton').click();B.draw();
   if(B.getState().view==='book')B.action('view','model');if(kind==='human_transport'&&i===5)B.action('view','fish');if(kind==='plant_transport'&&i===3){B.action('prediction','xylem');for(let n=0;n<3;n++)B.action('action','next');}if(kind==='immune_defense'&&i===3){B.action('antigen',0);B.action('antibody',0);B.action('dockAction','bind');}
   await new Promise(r=>setTimeout(r,90));B.draw();
   // Frozen-state pixel identity under 1 s of animation-frame time.
   B.getState().running=false;B.draw();E.advance();const frozen=hash(ctx.getImageData(0,0,960,600).data);for(let n=0;n<60;n++)E.advance();assert.equal(hash(ctx.getImageData(0,0,960,600).data),frozen,'Pause freezes native pixels');r.pauseTests++;
   B.getState().running=true;B.draw();E.advance();const before=hash(ctx.getImageData(0,0,960,600).data);for(let n=0;n<60;n++)E.advance();const after=hash(ctx.getImageData(0,0,960,600).data);
   if(!tab.static)assert.notEqual(before,after,`${spec.section}/${tab.id}/${code}: live model changes over 1 second`);
   let overflowBefore=report.textOverflow.length;const old=ctx.fillText; textAudit(ctx,`${spec.section}/${tab.id}/${code}`);B.draw();ctx.fillText=old;
   const suffix=`${kind}_${i}_${code}`;fs.writeFileSync(path.join(out,suffix+'.png'),canvas.canvas.toBuffer('image/png'));shots.push({file:suffix+'.png',name:`${spec.section} ${i+1} ${code}`});
   r.tabs.push({id:tab.id,language:code,animated:before!==after,captionLength:id('captionText').textContent.length,textOverflow:report.textOverflow.length-overflowBefore,check:tab.check?JSON.parse(JSON.stringify(tab.check(B.getState()))):null});
  }
 }
 B.setLanguage('zh');B.setTab(0);
 if(kind==='plant_transport'){
  B.action('case','leaf');assert.equal(B.getTab().check(B.getState()).direction,'down');B.action('case','root');assert.equal(B.getTab().check(B.getState()).direction,'up');
  B.setTab(3);id('resetButton').click();const next=d.querySelectorAll('#controls button').find(b=>b.dataset.key==='action'&&JSON.parse(b.dataset.value)==='next');assert(next.disabled);B.action('prediction','xylem');for(let n=0;n<5;n++)B.action('action','next');assert.equal(B.getState().step,5);assert.equal(B.getTab().check(B.getState()).actualWaitMinutes,30);
 }
 if(kind==='human_transport'){
  B.setTab(3);const check=B.getTab().check(B.getState());assert(check.closed);assert.deepEqual(Array.from(check.route),['lv','aorta','body','cava','ra','rv','pa','lung','pv','la','lv']);assert.equal(check.oxygenAtLeftVentricle,1);assert(check.oxygenAtRightVentricle>0&&check.oxygenAtRightVentricle<check.oxygenAtLeftVentricle,'Oxygen-poor blood is not oxygen-free');
  B.setTab(5);assert.deepEqual(Array.from(B.getTab().check(B.getState()).protocolSeconds),[300,60,180,60]);B.action('action','start');for(let n=0;n<60;n++)E.advance(1000);assert(B.getState().timer,'Real interval runs independently from animation time');
 }
 if(kind==='immune_defense'){
  B.setTab(3);for(let a=0;a<3;a++)for(let b=0;b<3;b++){B.action('antigen',a);B.action('antibody',b);B.action('dockAction','bind');const q=B.getTab().check(B.getState());assert.equal(q.compatible,a===b);assert.equal(q.bound,a===b);B.action('dockAction','assist');assert.equal(B.getTab().check(B.getState()).assistedRemoval,a===b);}
  B.setTab(4);B.action('memoryCase',1);assert(B.getTab().check(B.getState()).matchingMemory);B.action('memoryCase',2);assert(!B.getTab().check(B.getState()).matchingMemory);
 }
 return r;
}
(async()=>{
 for(const kind of ['plant_transport','human_transport','immune_defense'])await unit(kind);
 const baseline=JSON.parse(fs.readFileSync(path.join(base,'local-backups/20261008/ch4_new_units_pre.U8xuCz/baseline.json'),'utf8'));
 const protectedFiles=baseline.protectedFiles;let unchanged=0,changed=[];for(const {file,sha256} of protectedFiles){if(!fs.existsSync(path.join(base,file))||hash(fs.readFileSync(path.join(base,file)))!==sha256)changed.push(file);else unchanged++;}report.protectedFiles={unchanged,changed};
 if(publication){report.authorizedPublicationChanges=['index.html','assets/biology/chapter4_progress.md'];assert.deepEqual(changed.filter(f=>!report.authorizedPublicationChanges.includes(f)),[],'Existing lessons remain unchanged');report.scope='Publish formal 4-2/4-3/4-4 and homepage entries';}
 const cols=4,thumbW=300,thumbH=214,sheet=createCanvas(cols*thumbW,Math.ceil(shots.length/cols)*thumbH),c=sheet.getContext('2d');c.fillStyle='#11261f';c.fillRect(0,0,sheet.width,sheet.height);
 for(let i=0;i<shots.length;i++){const im=await loadImage(path.join(out,shots[i].file)),x=i%cols*thumbW,y=Math.floor(i/cols)*thumbH;c.drawImage(im,x,y+24,thumbW,187.5);c.fillStyle='#f2ecd9';c.font='16px "Noto Sans TC"';c.fillText(shots[i].name,x+8,y+18);}
 fs.writeFileSync(path.join(out,'contact.png'),sheet.toBuffer('image/png'));fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({units:report.units.map(u=>({section:u.section,tabs:u.tabs.length/2,actions:u.actions,fullscreenTests:u.fullscreenTests,pauseTests:u.pauseTests})),textOverflow:report.textOverflow.length,protected:report.protectedFiles,out},null,2));
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
