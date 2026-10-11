/* Native Canvas and simulated DOM/event regression; not a physical iPad test. */
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert'),crypto=require('crypto');
const {createCanvas}=require('/Users/lvyanjun/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@napi-rs/canvas');
const base=path.resolve(__dirname,'../..'),read=f=>fs.readFileSync(path.join(base,f),'utf8');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const old=require('./matter_transport_v4.js'),next=require('./matter_transport_v5.js');
const out='/private/tmp/matter_refinement_1011_v1_qa';fs.mkdirSync(out,{recursive:true});
const report={mode:'Native Canvas + simulated DOM/events; browser checks recorded separately',protectedFunctions:[],unchangedMembraneFrames:[],animations:[],events:[]};
for(const key of Object.keys(old))if(typeof old[key]==='function'&&key!=='drawMembrane'){
  assert.equal(next[key].toString(),old[key].toString(),key+' byte-identical, including every coordinate/constant');report.protectedFunctions.push(key);
}
function frame(api,species,t){const canvas=createCanvas(900,360);api.drawMembrane(canvas.getContext('2d'),species,t);return canvas;}
function pixels(canvas){return canvas.getContext('2d').getImageData(0,0,900,360).data;}
for(const species of ['water','glucose','starch'])for(const t of [0,.4,1,7]){
  assert.equal(hash(pixels(frame(old,species,t))),hash(pixels(frame(next,species,t))),species+' pixels unchanged at '+t);report.unchangedMembraneFrames.push({species,t});
}
const arcs=[],probe={beginPath(){},arc(...args){arcs.push(args);},fill(){}};
next.oxygenMolecule(probe,100,100);assert.equal(arcs.length,2);assert.equal(arcs[0][2],arcs[1][2]);assert(arcs[1][0]-arcs[0][0]<arcs[0][2]*2,'O atoms touch');
const protein=next.proteinGeometry();assert.equal(protein.nodes.length,48);assert.equal(protein.paths.length,1);assert.deepEqual(protein.paths[0],protein.nodes,'One continuous folded amino-acid chain');
for(let i=1;i<protein.nodes.length;i++)assert(Math.hypot(protein.nodes[i].x-protein.nodes[i-1].x,protein.nodes[i].y-protein.nodes[i-1].y)<30,'Consecutive amino acids connected');
for(let t=0;t<=100;t+=.5)for(let k=0;k<2;k++)for(const p of protein.nodes){
  const x=235+k*425+Math.sin(t*.55+k)*7+p.x,y=65+Math.sin(t*.65+k)*8+p.y;
  assert(x-5.3>0&&x+5.3<900);assert(y-5.3>0&&y+5.3<129,'Protein never touches/passes outer lipid heads');
}
// The lower membrane and intracellular area are identical to the blocked starch mode.
for(const t of [0,1,4,10])assert.equal(hash(pixels(frame(next,'protein',t)).slice(129*900*4)),hash(pixels(frame(old,'starch',t)).slice(129*900*4)));
const contact=createCanvas(900,5*390),cc=contact.getContext('2d');cc.fillStyle='#11261f';cc.fillRect(0,0,900,1950);
for(const [i,species] of ['oxygen','water','glucose','starch','protein'].entries()){
  const a=frame(next,species,0),b=frame(next,species,1);assert.notEqual(hash(pixels(a)),hash(pixels(b)),species+' moves over one second');
  fs.writeFileSync(path.join(out,species+'_0.png'),a.toBuffer('image/png'));fs.writeFileSync(path.join(out,species+'_1.png'),b.toBuffer('image/png'));
  cc.fillStyle='#f2ecd9';cc.font='20px sans-serif';cc.fillText(species,16,i*390+24);cc.drawImage(b,0,i*390+30);report.animations.push({species,oneSecondPixelChange:true});
}
fs.writeFileSync(path.join(out,'contact.png'),contact.toBuffer('image/png'));
const prefix=read('assets/biology/chapter1_compact_check_1008_v1.cjs').split('function normalize(html)')[0]
 .replace('get children(){','get parentNode(){return this.parentElement;}get children(){')
 .replace('dispatchEvent(e){e.target??=this;e.currentTarget=this;for(const fn of this.events[e.type]||[])fn(e);if(e.bubbles&&!e.stopped)this.parentElement?.dispatchEvent(e);return true;}',
  'dispatchEvent(e){e.target??=this;const route=[this];if(e.bubbles){let p=this.parentElement;while(p){route.push(p);p=p.parentElement;}}for(const n of route){e.currentTarget=n;for(const fn of n.events[e.type]||[])fn(e);if(e.stopped)break;}return true;}');
const harness={require,__dirname,console,setTimeout};vm.runInNewContext(prefix+'\nthis.environment=environment;',harness);
async function main(){
  const html=read('biology_matter_transport.html'),E=harness.environment(html),d=E.document,id=n=>d.getElementById(n),all=s=>d.querySelectorAll(s);
  for(const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)){const src=m[1].match(/src="([^"?]+)/)?.[1];E.run(src?read(src):m[2],src||'inline');}
  await new Promise(r=>setTimeout(r,100));E.advance();const api=E.context.MatterTransport;
  assert.equal(d.documentElement.lang,'zh-Hant');id('introScreen').click();assert(id('introScreen').hidden);
  assert.deepEqual(all('.hero')[0].children.map(n=>n.tagName),['H1','P'],'Only main title and short lead');
  assert.equal(all('.material-card').length,4);assert.equal(all('.material-card .number').length,0);
  assert.deepEqual(all('.atomic-elements span').map(n=>n.textContent),['C','H','O','N']);
  const speciesButtons=[['memOxygen','oxygen'],['memWater','water'],['memGlucose','glucose'],['memStarch','starch'],['memProtein','protein']];
  const language=code=>all('[data-language]').find(n=>n.dataset.language===code).click();
  for(const code of ['zh','en']){
    language(code);
    for(let tab=0;tab<5;tab++){all('.tab-btn')[tab].click();assert.equal(all('.lesson').filter(n=>!n.hidden).length,1);assert.equal(E.queue.size,tab>=2?1:0);}
    all('.tab-btn')[2].click();
    for(const [button,species] of speciesButtons){
      id(button).click();assert.equal(api.getState().species,species);assert.equal(speciesButtons.filter(([name])=>id(name).classList.contains('active')).length,1);
      assert.equal(id(button).getAttribute('aria-pressed'),'true');assert(id('membraneStatus').textContent);
      const canvas=id('membraneCanvas'),a=hash(canvas.getContext('2d').getImageData(0,0,900,360).data);for(let n=0;n<61;n++)E.advance();
      assert.notEqual(hash(canvas.getContext('2d').getImageData(0,0,900,360).data),a,'Bilingual animation advances');assert.equal(E.queue.size,1);
      if(species==='protein')assert(id('membraneStatus').textContent.includes(code==='zh'?'不能直接':'directly'));
      if(species==='oxygen')assert(id('membraneStatus').textContent.includes(code==='zh'?'兩顆':'two joined'));
    }
    report.events.push(code+': five tabs and five material modes, explanations, single RAF, one-second animation');
    all('.tab-btn')[3].click();id('diffAdd').click();assert(api.getState().diffAdded);E.advance();
    const total=api.getState().diff.particles.length;assert.equal(total,240);id('diffPause').click();assert(api.getState().diffPaused);
    const paused=JSON.stringify(api.getState().diff);for(let i=0;i<10;i++)E.advance();assert.equal(JSON.stringify(api.getState().diff),paused);
    id('diffPause').click();id('diffFast').click();E.advance();id('diffNormal').click();id('diffReset').click();assert(!api.getState().diffAdded);
    report.events.push(code+': diffusion add/pause/resume/speed/reset and particle conservation');
    all('.tab-btn')[4].click();
    for(const [cell,type] of [['osmPlant','plant'],['osmRedCell','redcell']])for(const [condition,value] of [['osmPure',0],['osmSame',1],['osmSalt',2]]){
      id(cell).click();id(condition).click();assert.equal(api.getState().cellType,type);assert.equal(api.getState().osm.external,value);E.advance();
      id('osmPause').click();assert(api.getState().osmPaused);id('osmReset').click();assert(!api.getState().osmPaused);assert(id('osmCaption').textContent);
    }
    report.events.push(code+': plant/RBC, three solutions, pause/repeat');
    for(const [tab,button,lab] of [[3,'diffFullscreen','diffusionLab'],[4,'osmFullscreen','osmosisLab']]){
      all('.tab-btn')[tab].click();id(button).click();assert(id(lab).classList.contains('is-expanded'));id(button).click();assert(!id(lab).classList.contains('is-expanded'));
      id(button).click();E.emit('keydown',{key:'Escape'});assert(!id(lab).classList.contains('is-expanded'));assert(!d.body.classList.contains('lab-open'));
    }
    report.events.push(code+': both labs fullscreen/button exit/Escape');
  }
  language('zh');assert.equal(all('.photo-card img').length,3,'Three original licensed photos retained');
  const originals=[...read('assets/biology/matter_transport_v4.js').matchAll(/photo\('([^']+)'/g)].map(m=>m[1]);
  assert.deepEqual(all('.photo-card img').map(n=>n.src),originals);
  assert(read('assets/biology/matter_refinement_1011_v1.css').includes('repeat(4, minmax(0, 1fr))'));
  fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}
main().catch(e=>{console.error(e.stack);process.exitCode=1;});
