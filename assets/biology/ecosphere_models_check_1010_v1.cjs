/* Read-only checks for the new ecosphere model sidecar.
 * node ecosphere_models_check_1010_v1.cjs [--contact [en]]
 * Requires @napi-rs/canvas for actual raster differences; never writes files.
 * Native Canvas + bundled fonts is NOT a real iPad/browser validation.
 */
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const {createCanvas,GlobalFonts}=require('@napi-rs/canvas');
const root=__dirname;
for(const name of ['NotoSansTC','JetBrainsMono']) {
  const family=name==='NotoSansTC'?'Noto Sans TC':'JetBrains Mono';
  assert(GlobalFonts.registerFromPath(path.join(root,'fonts',name+'-variable.ttf'),family),'Required real font missing: '+family);
}
const sandbox={window:{},console};vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(root,'new_books_shell_1010_v1.js'),'utf8'),sandbox);
vm.runInContext(fs.readFileSync(path.join(root,'ecosphere_models_1010_v1.js'),'utf8'),sandbox);
const B=sandbox.window.LivingBook,M=sandbox.window.EcosphereModels,H=M.helpers;
const clone=o=>JSON.parse(JSON.stringify(o));
const names=['biosphere','sampling','population','succession','foodweb','carbon','relations','habitat','diversity','threats','magnification','climate','conservation'];
const near=(a,b,eps=1e-9)=>assert(Math.abs(a-b)<eps,`${a} != ${b}`);
const immutable=o=>{Object.freeze(o);Object.values(o).forEach(v=>{if(v&&typeof v==='object')immutable(v);});return o;};

// Independent expected outcomes, not snapshots of the implementation.
assert.deepStrictEqual(clone(H.quadratEstimate([4,5,3],8)),{mean:4,density:4,total:32});
assert.deepStrictEqual(clone(H.quadratEstimate([4,5,3],200,25)),{mean:4,density:.16,total:32});
assert.equal(H.quadratEstimate([],8),null);assert.equal(H.quadratEstimate([1],0),null);
assert.equal(H.markRecapture(20,30,5),120);
for(const args of [[20,30,0],[20,30,21],[20,3,4],[0,10,2]])assert.equal(H.markRecapture(...args),null);
assert.deepStrictEqual(clone(H.populationBalance(40,8,3,4,2)),{next:47,delta:7,valid:true});
assert.equal(H.populationBalance(40,0,20,0,20).next,0);
assert.equal(H.populationBalance(5,0,7,0,0).valid,false);
const energy=H.energyBudget(1000,.1);assert.deepStrictEqual(clone(energy.levels),[1000,100,10]);
near(energy.levels[1]+energy.notTransferred[0],1000);near(energy.levels[2]+energy.notTransferred[1],100);
assert.deepStrictEqual(clone(H.concentrations(1,4)),[1,4,16,64]);
assert.deepStrictEqual(clone(H.concentrations(2,.5)),[2,1,.5,.25]);
assert.deepStrictEqual(clone(H.foodEdges),[[0,1],[1,2],[0,3],[3,2]]);
assert(H.carbonEdges.some(e=>e.from==='air'&&e.to==='plant'&&e.process==='photosynthesis'));
for(const from of ['plant','animal'])assert(H.carbonEdges.some(e=>e.from===from&&e.to==='air'&&e.process==='respiration'));
assert(H.carbonEdges.some(e=>e.from==='fossil'&&e.to==='air'&&e.process==='combustion'));
for(let n=2;n<=5;n++)for(let trial=0;trial<8;trial++)assert.equal(new Set(H.sampleIndices(n,trial)).size,n);

let rotations=0;
for(let yaw=-Math.PI;yaw<=Math.PI;yaw+=Math.PI/12)for(const pitch of [0,.35,.55,.96])for(const point of [[100,40,-90],[0,180,0],[-320,0,205]]) {
  const rotated=H.rotate3(point,yaw,pitch);near(Math.hypot(...rotated),Math.hypot(...point),1e-8);
  const projected=H.project3(point,yaw,pitch);assert(projected.depth>200);assert(Object.values(projected).every(Number.isFinite));rotations++;
}
const left=H.project3([-100,0,0],0,0),right=H.project3([100,0,0],0,0);near(left.x+right.x,960);
assert(H.project3([100,0,100],0,0).scale>H.project3([100,0,-100],0,0).scale,'Near objects must project larger');
const nearFace={points:[[-10,-10,100],[10,-10,100],[0,10,100]],color:'#ffffff'},farFace={points:[[-10,-10,-100],[10,-10,-100],[0,10,-100]],color:'#ffffff'};
assert.equal(H.sortedFaces([nearFace,farFace],0,0)[0].depth,-100);
assert.equal(H.sortedFaces([nearFace,farFace],Math.PI,0)[0].index,0,'Rotation must reverse occlusion order');
const mesh=H.sphereMesh([0,0,0],100,'#4ade80');for(const f of mesh)for(const p of f.points)near(Math.hypot(...p),100,1e-8);
assert(mesh.some(f=>f.points.some(p=>p[2]<-50))&&mesh.some(f=>f.points.some(p=>p[2]>50)),'Sphere needs front AND back world geometry');

function render(tab,state,time=0,lang='zh',skipText=-1) {
  B.setLanguage(lang);
  const canvas=createCanvas(960,600),ctx=canvas.getContext('2d'),rows=[];
  const fill=ctx.fillText.bind(ctx);let seq=0;
  ctx.fillText=(str,x,y,...rest)=>{
    const mt=ctx.measureText(str),w=mt.width,size=Number(ctx.font.match(/([\d.]+)px/)[1]);
    const left=ctx.textAlign==='center'?x-w/2:ctx.textAlign==='right'?x-w:x;
    rows.push({str,left,right:left+w,top:y-mt.actualBoundingBoxAscent,bottom:y+mt.actualBoundingBoxDescent,size});
    if(seq++!==skipText)fill(str,x,y,...rest);
  };
  const saved=JSON.stringify(state);tab.draw(ctx,immutable(clone(state)),time,B.D);assert.equal(JSON.stringify(state),saved,'draw mutated state');
  return {canvas,rows,pixels:ctx.getImageData(0,0,960,600).data};
}
function delta(a,b){let n=0;for(let i=0;i<a.length;i+=4)if(Math.abs(a[i]-b[i])+Math.abs(a[i+1]-b[i+1])+Math.abs(a[i+2]-b[i+2])>12)n++;return n;}
function scenarios(tab) {
  const initial=tab.init(),out=[initial],seen=new Set([JSON.stringify(initial)]);
  // All exposed discrete values and numeric extremes, including conditional groups.
  // Camera sweeps are separately tested mathematically, so limit BFS to teaching parameters.
  let frontier=[initial];
  for(let depth=0;depth<2;depth++) {
    const next=[];
    for(const state of frontier)for(const g of tab.controls(state))for(const it of g.items) {
      if(['angle','pitch','spin','view'].includes(it.key))continue;
      for(const value of it.input?[it.input.min,it.input.max]:[it.value]) {
        const s=clone(state);tab.act(s,it.key,value);const key=JSON.stringify(s);
        if(!seen.has(key)){seen.add(key);out.push(s);next.push(s);}
      }
    }frontier=next;
  }
  if(tab.controls(initial).some(g=>g.items.some(i=>i.key==='angle')))for(const angle of [90,180,270])out.push({...initial,angle});
  return out;
}

if(process.argv.includes('--image')) {
  const at=process.argv.indexOf('--image'),name=process.argv[at+1],tab=M[name]({}),s=tab.init();
  if(process.argv[at+2]&&process.argv[at+2]!=='en')Object.assign(s,JSON.parse(process.argv[at+2]));
  const result=render(tab,s,1,process.argv.includes('en')?'en':'zh');
  console.log(result.canvas.toDataURL('image/jpeg',.35));process.exit(0);
}
if(process.argv.includes('--contact')) {
  const en=process.argv.includes('en'),canvas=createCanvas(1920,Math.ceil(names.length/4)*320),ctx=canvas.getContext('2d');
  ctx.fillStyle='#11261f';ctx.fillRect(0,0,canvas.width,canvas.height);
  names.forEach((name,i)=>{const tab=M[name]({}),im=render(tab,tab.init(),1,en?'en':'zh');ctx.drawImage(im.canvas,i%4*480,Math.floor(i/4)*320+20,480,300);ctx.fillStyle='#f2ecd9';ctx.font='16px "Noto Sans TC"';ctx.fillText(name,i%4*480+8,Math.floor(i/4)*320+17);});
  console.log(canvas.toDataURL('image/jpeg',.65));process.exit(0);
}

const report={status:'PASS',factories:13,mathRotations:rotations,scienceChecks:24,states:0,frames:0,initialPixelDeltas:{},warnings:[],limits:'Native Canvas checks with real bundled fonts, not browser or physical-iPad validation.'};
const overflow=[],overlap=[];
for(const name of names) {
  const opts={id:'id-'+name,title:['標題','Title'],sub:['副標','Subtitle'],hook:['提問','Question'],body:['內文','Body'],closure:['收束','Closure'],reading:['閱讀','Reading'],record:['紀錄','Record'],sources:[{name:['來源','Source'],page:120}]};
  const tab=M[name](opts);for(const k of Object.keys(opts))assert.strictEqual(tab[k],opts[k],name+' must preserve '+k);
  assert.equal(tab.init().view,0);assert.equal(tab.init().running,true);
  const states=scenarios(tab);report.states+=states.length;
  for(const lang of ['zh','en']) {
    const start=render(tab,tab.init(),0,lang),later=render(tab,tab.init(),1,lang),paused=render(tab,{...tab.init(),running:false,elapsed:1},1,lang),again=render(tab,{...tab.init(),running:false,elapsed:1},1,lang);
    report.initialPixelDeltas[name+'/'+lang]=delta(start.pixels,later.pixels);
    assert(report.initialPixelDeltas[name+'/'+lang]>25,name+' initial animation must change pixels');
    assert.equal(delta(paused.pixels,again.pixels),0,name+' paused render must be deterministic');
    for(const s of states) {
      const result=render(tab,s,.67,lang);report.frames++;
      for(const row of result.rows) {
        assert(row.size>=22,name+' font below 22');
        if(row.left<-.1||row.right>960.1||row.top<-.1||row.bottom>600.1)overflow.push({name,lang,state:s,row});
      }
      for(let i=0;i<result.rows.length;i++)for(let j=i+1;j<result.rows.length;j++) {
        const a=result.rows[i],b=result.rows[j];if(a.left<b.right-2&&b.left<a.right-2&&a.top<b.bottom-2&&b.top<a.bottom-2)overlap.push({name,lang,state:s,a:a.str,b:b.str});
      }
      const e=tab.explain(immutable(clone(s)));assert(e.title.length===2&&e.text.length===2,name+' bilingual caption');assert(e.text[0].length>60&&e.text[1].length>160,name+' detailed explanations');
    }
    // Text visibility: each initial row must contribute visible pixels on the real background.
    const full=render(tab,tab.init(),0,lang);
    for(let i=0;i<full.rows.length;i++)assert(delta(full.pixels,render(tab,tab.init(),0,lang,i).pixels)>3,name+' invisible initial text: '+full.rows[i].str);
  }
  // First-picture view must not call model drawing or mutate/crop source data.
  const original={file:'fixture-only.png',page:123,name:['原圖','Original'],text:['原圖說明','Original description']};
  const withPic=M[name]({pics:[original]}),s=withPic.init();withPic.act(s,'view',1);
  let calls=[];const ctx=createCanvas(960,600).getContext('2d'),D={...B.D,image:(c,...args)=>calls.push(args)};
  withPic.draw(ctx,immutable(clone(s)),0,D);assert.deepStrictEqual(calls,[['fixture-only.png',24,84,912,426]]);assert.deepStrictEqual(clone(withPic.explain(s).text),original.text);
  assert.equal(withPic.controls(s).length,1,'Original view hides model controls');
}
assert.equal(overflow.length,0,JSON.stringify(overflow.slice(0,10),null,2));
assert.equal(overlap.length,0,JSON.stringify(overlap.slice(0,10),null,2));
const source=fs.readFileSync(path.join(root,'ecosphere_models_1010_v1.js'),'utf8');
assert(!/requestAnimationFrame|setInterval|Date\.now|performance\.now|Math\.random/.test(source),'Models must use shell time and deterministic drawing');
console.log(JSON.stringify(report,null,2));
