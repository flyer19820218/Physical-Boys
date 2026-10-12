/* Read-only source/asset checks. Writes generated QA only into mkdtemp. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),os=require('node:os'),assert=require('node:assert/strict');
const runtime=process.env.CODEX_NODE_MODULES||'/Users/lvyanjun/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
const {createCanvas,loadImage,GlobalFonts}=require(path.join(runtime,'@napi-rs/canvas'));
const repo=path.resolve(__dirname,'../..');
const fontDir=process.env.CODEX_QA_FONT_DIR||path.join(__dirname,'fonts');
for(const [file,font]of[['NotoSansTC-variable.ttf','Noto Sans TC'],['JetBrainsMono-variable.ttf','JetBrains Mono']])assert(GlobalFonts.registerFromPath(path.join(fontDir,file),font));
const files=['heart.png','body_circulation.png','vessel_atlas.png','vessel_photo.png','capillary_micrograph.png','blood_vessel.png','blood_smear.png','blood_electron_original.png','lymph_body.png','tissue_gas.png','lung_gas.png','stethoscope_photo.png','pulse_photo.png','fish_photo.png'];
let now=0,lang='zh',spec;
const clock={now:()=>now};
const textLog=[],imageCache={};
function capture(source){let result;vm.runInNewContext(source,{LivingBook:{register:s=>{result=s;}},Date:clock});return result;}
const backup=path.join(repo,'local-backups/20261012-human-upgrade-pre.w4cvLk/human_transport_1008_v1.js');
const oldText=fs.existsSync(backup)?fs.readFileSync(backup,'utf8'):require('node:child_process').execFileSync('git',['show','37819695e591149f25f1ba7cb58e83874834971a:assets/biology/human_transport_1008_v1.js'],{cwd:repo,encoding:'utf8'});
const baseline=capture(oldText), currentText=fs.readFileSync(path.join(__dirname,'human_transport_1008_v1.js'),'utf8');
const D={
  tr:p=>Array.isArray(p)?p[lang==='zh'?0:1]:String(p??''),hit:()=>{},status:()=>{},
  text(c,p,x,y,o={}){const str=D.tr(p),size=o.size||24;let fit=size;c.save();c.font=`700 ${fit}px "Noto Sans TC", "JetBrains Mono"`;if(o.max)while(fit>22&&c.measureText(str).width>o.max)c.font=`700 ${--fit}px "Noto Sans TC", "JetBrains Mono"`;c.fillStyle=o.color||'#f2ecd9';c.textAlign=o.align||'left';c.fillText(str,x,y);c.restore();return fit;},
  round(c,x,y,w,h,r,fill,stroke){c.beginPath();c.roundRect(x,y,w,h,r);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=2;c.stroke();}},
  line(c,p,color,width=2){c.save();c.lineWidth=width;c.strokeStyle=color;c.lineCap='round';c.lineJoin='round';c.beginPath();p.forEach((q,i)=>c[i?'lineTo':'moveTo'](...q));c.stroke();c.restore();},
  sphere(c,x,y,r,color){c.save();const g=c.createRadialGradient(x-r*.32,y-r*.35,1,x,y,r);g.addColorStop(0,'#fff8e8');g.addColorStop(.3,color);g.addColorStop(1,color);c.fillStyle=g;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();c.restore();},
  water(c,x,y,s=15){D.sphere(c,x-s*.65,y-s*.67,s*.46,'#f2ecd9');D.sphere(c,x+s*.65,y-s*.67,s*.46,'#f2ecd9');D.sphere(c,x,y,s*.66,'#f472b6');},
  oxygen(c,x,y,s=10){D.sphere(c,x-s*.95,y,s,'#f472b6');D.sphere(c,x+s*.95,y,s,'#f472b6');},
  co2(c,x,y,s=10){D.sphere(c,x-s*2,y,s,'#f472b6');D.sphere(c,x+s*2,y,s,'#f472b6');D.sphere(c,x,y,s*1.35,'#506962');},
  image(c,file,x,y,w,h){const im=imageCache[file],k=Math.min(w/im.width,h/im.height),ww=im.width*k,hh=im.height*k,xx=x+(w-ww)/2,yy=y+(h-hh)/2;c.drawImage(im,xx,yy,ww,hh);return{x:xx,y:yy,w:ww,h:hh};},
  focus(c,file,crop,dest){const im=imageCache[file],[a,b,w,h]=crop,[x,y,dw,dh]=dest,k=Math.min(dw/(im.width*w),dh/(im.height*h)),ww=im.width*w*k,hh=im.height*h*k;c.drawImage(im,a*im.width,b*im.height,w*im.width,h*im.height,x+(dw-ww)/2,y+(dh-hh)/2,ww,hh);}
};
const out=fs.mkdtempSync(path.join(os.tmpdir(),'human-upgrade-1013-'));
const report={output:out,fonts:'Repository Noto Sans TC and JetBrains Mono'+(process.env.CODEX_QA_FONT_DIR?' instantiated at wght=700':' variable-font defaults'),protectedOriginals:[],scenes:[],graph:[],timers:[],textKnockouts:0,columnVisibilityChecks:0,maxInvisibleInkColumns:0};
async function main(){
  for(const file of files)imageCache[file]=await loadImage(path.join(__dirname,'ch4_new_1008_v1',file));
  for(const file of ['organ_atlas.png','heart_valves_frames.webp'])imageCache['assets/biology/human_transport_media_1012_v1/'+file]=await loadImage(path.join(__dirname,'human_transport_media_1012_v1',file));
  class ImageProxy{set src(file){this.native=imageCache[file];assert(this.native,'Image exists: '+file);}get complete(){return true;}get naturalWidth(){return this.native?.width||0;}get width(){return this.native?.width||0;}get height(){return this.native?.height||0;}}
  const scope={LivingBook:{register:s=>{spec=s;}},Image:ImageProxy,Date:clock};
  for(const f of ['human_transport_teaching_1012_v1.js','human_transport_cutaways_1012_v1.js','human_transport_circulation_1012_v1.js','human_transport_valve_media_1012_v1.js','human_transport_upgrade_1012_v1.js','human_transport_1008_v1.js'])vm.runInNewContext(fs.readFileSync(path.join(__dirname,f),'utf8'),scope,{filename:f});
  assert.equal(spec.tabs.length,6);assert.equal(spec.title[0],'人體的運輸');
  for(let i=0;i<6;i++)for(const f of ['init','controls','act','draw','check']){
    if(i===4&&['draw','check'].includes(f))continue;
    const a=baseline.tabs[i][f],b=scope.HumanTransportUpgrade.originals[spec.tabs[i].id][f];
    assert.equal(a?.toString(),b?.toString(),`Original ${spec.tabs[i].id}.${f} preserved`);report.protectedOriginals.push(`${spec.tabs[i].id}.${f}`);
  }
  assert(!currentText.includes('const direct ='));assert(!currentText.includes('const viaBlood ='));
  assert.equal(spec.tabs[4].check().bothReturnPaths,false);
  for(const [start,end]of[['completeTimer','countBeat'],['countBeat','experimentAct'],['experimentAct','experimentDraw'],['experimentDraw','fishDraw']]){
    const extract=s=>s.slice(s.indexOf('  function '+start+'('),s.indexOf('  function '+end+'('));assert.equal(extract(oldText),extract(currentText));
  }
  const exp=spec.tabs[5],s=exp.init();s.view='records';s.stage=1;now=1000;exp.act(s,'action','start');
  assert.equal(s.timer.deadline,61000);exp.act(s,'action','heart');exp.act(s,'action','pulse');assert.equal(s.heartCount,1);assert.equal(s.pulseCount,1);
  now=30000;exp.act(s,'stage',3);assert.equal(s.stage,1);s.running=false;now=61000;
  const c=createCanvas(960,600);exp.draw(c.getContext('2d'),s,0,D);assert(s.timer.done);assert.equal(s.records.before.seconds,60);assert.equal(s.records.before.heart,1);
  report.timers.push({realDeadline:61000,pausedAnimationStillSettles:true,countsRecordedNotAutoFilled:true,stageChangeBlockedDuringTimer:true});
  const graph=scope.HumanTransportCirculation.graph;
  const reach=(from,to,seen=new Set())=>from===to||(!seen.has(from)&&(seen.add(from),(graph[from]||[]).some(n=>reach(n,to,seen))));
  for(const o of scope.HumanTransportCirculation.organs){assert(reach('lv',o.id));assert(reach(o.id,'lv'));report.graph.push(o.id+' has complete return circuit');}
  assert.deepEqual([...graph.intestine],['portal']);assert.deepEqual([...graph.portal],['liver']);assert.deepEqual([...graph.coronarySinus],['ra']);assert(!graph.aorta.includes('lung'));assert.deepEqual([...graph.rv],['pa']);assert.deepEqual([...graph.pa],['lung']);assert.deepEqual([...graph.lung],['pv']);assert.deepEqual([...graph.pv],['la']);
  const scenarios=[['medical',0,{view:'medical'}],['heart',0,{view:'heart'}],['body',0,{view:'body'}],
    ['artery',1,{}],['vein',1,{vessel:'vein',squeeze:true}],['capillary',1,{vessel:'capillary'}],['vessel-section',1,{view:'micrograph'}],
    ['blood',2,{}],['blood-em',2,{view:'em'}],['blood-focus',2,{view:'focus',component:'platelet'}],['clot',2,{task:'repair',repair:.7}],['centrifuge',2,{task:'separate',separation:1,targetSeparation:1}],
    ...scope.HumanTransportCirculation.organs.map(o=>['route-'+o.id,3,{organ:o.id}]),['tissue-exchange',3,{view:'body'}],['lung-exchange',3,{view:'lung'}],
    ['lymph',4,{}],['pulse',5,{view:'pulse'}],['records',5,{view:'records'}],['fish',5,{view:'fish'}]];
  for(lang of ['zh','en'])for(const[name,i,initial]of scenarios){
    const tab=spec.tabs[i],state={...tab.init(),...initial};let labelIndex=0,skip=-1;const cv=createCanvas(960,600),ctx=cv.getContext('2d'),nativeFill=ctx.fillText.bind(ctx),nativeDraw=ctx.drawImage.bind(ctx);
    let labels=[],captureInk=false;
    ctx.drawImage=(im,...args)=>nativeDraw(im.native||im,...args);
    ctx.fillText=(str,x,y)=>{const m=ctx.measureText(str),left=x-(ctx.textAlign==='center'?m.width/2:ctx.textAlign==='right'?m.width:0),box={x:Math.max(0,Math.floor(left)-3),y:Math.max(0,Math.floor(y-m.actualBoundingBoxAscent)-3)};box.w=Math.max(1,Math.min(960-box.x,Math.ceil(m.width)+6));box.h=Math.max(1,Math.min(600-box.y,Math.ceil(m.actualBoundingBoxAscent+m.actualBoundingBoxDescent)+6));const before=captureInk?ctx.getImageData(box.x,box.y,box.w,box.h).data.slice():null;const label={text:str,left,right:left+m.width,y,font:ctx.font,box};labels.push(label);if(labelIndex++!==skip)nativeFill(str,x,y);if(before){const after=ctx.getImageData(box.x,box.y,box.w,box.h).data;label.ink=Array.from({length:box.w},(_,col)=>{let n=0;for(let row=0;row<box.h;row++){const p=(row*box.w+col)*4;if(Math.abs(before[p]-after[p])+Math.abs(before[p+1]-after[p+1])+Math.abs(before[p+2]-after[p+2])>36)n++;}return n;});}};
    const frame=t=>{ctx.fillStyle='#11261f';ctx.fillRect(0,0,960,600);labels=[];labelIndex=0;tab.draw(ctx,state,t,D);};
    for(let f=0;f<=30;f++)frame(f/30);const a=ctx.getImageData(0,0,960,600).data.slice();for(let f=31;f<=60;f++)frame(f/30);const b=ctx.getImageData(0,0,960,600).data.slice();
    let changed=0;for(let p=0;p<a.length;p+=4)if(a[p]!==b[p]||a[p+1]!==b[p+1]||a[p+2]!==b[p+2])changed++;
    const staticExpected=['centrifuge'].includes(name);if(!staticExpected)assert(changed>80,`${name}/${lang}: animation actually moves`);
    const outside=labels.filter(l=>l.left<0||l.right>960||l.y>600);assert.equal(outside.length,0,`${name}/${lang}: out of canvas ${JSON.stringify(outside)}`);
    captureInk=true;frame(2);captureInk=false;const complete=ctx.getImageData(0,0,960,600).data.slice(),lastLabels=labels.slice();
    // The new compact strip intentionally masks the old strip and its caption.
    // Audit visible final labels, not the superseded text beneath that overlay.
    const supersededStrip=P=>name==='records'&&['動脈壁脈動模型：不是你的脈搏','Arterial pulse model: not your pulse'].includes(P.text);
    // Text knockout: compare fully composited final frames at identical state/time.
    for(let k=0;k<lastLabels.length;k++){if(supersededStrip(lastLabels[k]))continue;skip=k;frame(2);const knocked=ctx.getImageData(0,0,960,600).data,label=lastLabels[k],box=label.box;let pixels=0,run=0,maxRun=0;for(let col=0;col<box.w;col++){let visible=0;for(let row=0;row<box.h;row++){const p=((row+box.y)*960+col+box.x)*4;if(Math.abs(complete[p]-knocked[p])+Math.abs(complete[p+1]-knocked[p+1])+Math.abs(complete[p+2]-knocked[p+2])>36)visible++;}pixels+=visible;run=label.ink[col]>0&&visible===0?run+1:0;maxRun=Math.max(maxRun,run);}assert(pixels>10,`${name}/${lang}: invisible label ${label.text}`);assert(maxRun<4,`${name}/${lang}: ${maxRun}px of hidden ink in ${label.text}`);report.maxInvisibleInkColumns=Math.max(report.maxInvisibleInkColumns,maxRun);report.columnVisibilityChecks++;report.textKnockouts++;}
    skip=-1;frame(2);fs.writeFileSync(path.join(out,name+'-'+lang+'.png'),cv.toBuffer('image/png'));report.scenes.push({name,lang,changed,staticExpected,labels:lastLabels.length});
    assert(!Object.values(tab.explain(state)).some(v=>v===undefined));
  }
  fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({output:out,scenes:report.scenes.length,textKnockouts:report.textKnockouts,protectedOriginals:report.protectedOriginals.length,graph:report.graph,timers:report.timers},null,2));
}
main().catch(e=>{console.error(e);process.exitCode=1;});
