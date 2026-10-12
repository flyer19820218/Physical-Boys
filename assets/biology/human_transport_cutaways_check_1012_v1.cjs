/* Optional isolated validation. Only reads source/assets; renders into mkdtemp.
 * node human_transport_cutaways_check_1012_v1.cjs [--render]
 * --render uses bundled @napi-rs/canvas and the repository's exact font files.
 * Native Canvas checks do NOT claim a physical-iPad/browser integration test.
 */
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),os=require('node:os');
const source=fs.readFileSync(path.join(__dirname,'human_transport_cutaways_1012_v1.js'),'utf8');
const scope={};vm.runInNewContext(source,scope);
const api=scope.HumanTransportCutaways,g=api.geometry;
assert(!/requestAnimationFrame|setInterval|setTimeout/.test(source.replace(/\/\*[\s\S]*?\*\//g,'')),'No independent clock');
const report={syntax:true,phases:[],events:[],trajectories:0,minimumLumenMargin:Infinity,rendering:[]};
for(let n=0;n<40000;n++){
  const t=n*.001,q=api.timeline(t,.001);
  assert(!(q.avOpen&&q.slOpen),'AV and SL may not both open');
  assert.equal(q.leftEjecting,q.rightEjecting,'Both ventricles eject together');
  if(q.phase.startsWith('isovolumetric')){assert(!q.avOpen&&!q.slOpen);assert.equal(q.avFlow,0);assert.equal(q.slFlow,0);}
  assert(q.ventricularVolume>=.48-1e-10&&q.ventricularVolume<=1+1e-10);
  if(q.events.length)report.events.push(...q.events.map(e=>({id:e.id,at:e.at,sound:e.sound})));
}
assert.equal(report.events.filter(e=>e.sound==='S1').length,10);
assert.equal(report.events.filter(e=>e.sound==='S2').length,10);
assert.equal(new Set(report.events.map(e=>e.id)).size,report.events.length,'Events are unique over sequential frames');
for(const p of api.timeline.phases){
  const q=api.timeline((p.start+p.end)*2),a=api.timeline((p.start+.0001)*4),b=api.timeline((p.end-.0001)*4);
  if(p.id.startsWith('isovolumetric'))assert.equal(a.ventricularVolume,b.ventricularVolume,'Isovolumetric means constant volume');
  report.phases.push({id:p.id,at:p.start*4,avOpen:q.avOpen,slOpen:q.slOpen,sound:p.sound});
}
assert.equal(api.timeline(2,.02).events.at(-1).sound,'S1');
assert.equal(api.timeline(3.44,.02).events.at(-1).sound,'S2');
assert.equal(api.timeline(2,0).events.length,0,'Repeated redraw may not trigger sound');
for(let i=0;i<2000;i++){
  const t=i*.02;
  assert(g.pulseDisplacement(t+.001)>g.pulseDisplacement(t),'Blood always moves forward');
  assert(Math.abs(g.pulseProfile(130,t+.25)-g.pulseProfile(0,t))<1e-10,'Pulse travels 130px per .25s');
}
for(const [route,lanes,spacing,speed,radius,lumen] of [
  [g.vesselMain,[-26,-8,10,28],37,46,8,39],
  [g.vesselBranch,[-9,9],38,46,7,23],
  [g.bloodMain,[-27,-9,9,27],33,38,7.5,39],
  [g.bloodBranch,[-8,8],32,29,7,21]
])for(let frame=0;frame<300;frame++){
  const ps=g.cells(route,frame/30,lanes,spacing,speed,radius);
  for(const p of ps){
    assert(Number.isFinite(p.x)&&Number.isFinite(p.y)&&Number.isFinite(p.angle));
    const margin=lumen-Math.abs(p.lane)-p.r;
    assert(margin>0,'Whole cells, not just centres, remain inside lumen');
    report.minimumLumenMargin=Math.min(report.minimumLumenMargin,margin);report.trajectories++;
  }
  // Circular wrap is at the cut ends; all adjacent cells within the view retain headway.
  for(let a=0;a<ps.length;a++)for(let b=a+1;b<ps.length;b++){
    const distance=Math.hypot(ps[a].x-ps[b].x,ps[a].y-ps[b].y);
    assert(distance>=Math.min(ps[a].r,ps[b].r)*1.65,'Staggered cells must not pile up');
  }
}
let particles=[-26,-8,10,28].flatMap((lane,row)=>Array.from({length:19},(_,i)=>({d:40+i*42+(row%2)*20,lane,row,index:i,r:8})));
let valveChecks=0;
for(let i=0;i<6000;i++){
  const dt=1/60,m=g.veinMotion(i*dt,true),previous=particles;
  particles=g.stepVein(previous,dt,m,g.vesselMain.length);
  for(let j=0;j<particles.length;j++){
    const a=previous[j].d,b=particles[j].d;
    for(const [gate,open] of [[250,m.downstreamOpen],[665,m.upstreamOpen]])if(!open&&a>=gate+14){assert(b>=gate+14,'Cannot cross a closed venous valve');valveChecks++;}
    if(a>=0&&a<=g.vesselMain.length)assert(b<=a+1e-9,'No venous backflow');
  }
}
report.closedValveChecks=valveChecks;
assert.equal(g.heartRegions.ra.join(','),'0.1,0.34,0.32,0.3');
assert.equal(g.heartRegions.rv.join(','),'0.2,0.6,0.38,0.27');
assert.equal(g.heartRegions.la.join(','),'0.6,0.3,0.27,0.22');
assert.equal(g.heartRegions.lv.join(','),'0.57,0.52,0.35,0.4');

async function render(){
  const runtime=process.env.CODEX_NODE_MODULES||'/Users/lvyanjun/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
  const {createCanvas,loadImage,GlobalFonts}=require(path.join(runtime,'@napi-rs/canvas'));
  for(const [file,family] of [['NotoSansTC-variable.ttf','Noto Sans TC'],['JetBrainsMono-variable.ttf','JetBrains Mono']]){
    assert(GlobalFonts.registerFromPath(path.join(process.env.CODEX_QA_FONT_DIR||path.join(__dirname,'fonts'),file),family),'Exact font registration: '+family);
  }
  const files=['heart.png','body_circulation.png','vessel_atlas.png','vessel_photo.png','capillary_micrograph.png',
    'blood_smear.png','blood_vessel.png','blood_electron_original.png'];
  const images=Object.fromEntries(await Promise.all(files.map(async file=>[file,await loadImage(path.join(__dirname,'ch4_new_1008_v1',file))])));
  const out=fs.mkdtempSync(path.join(os.tmpdir(),'human-cutaways-1012-'));
  const scenarios=[
    ...api.timeline.phases.map(p=>['heart-'+p.id,'heartDraw',{auto:false,cutawayPhase:p.id,view:'heart',part:'lv'}]),
    ['heart-body','heartDraw',{auto:true,view:'body',part:'lv'}],
    ...['artery','vein','capillary'].map(vessel=>['vessel-'+vessel,'vesselsDraw',{view:'atlas',vessel,circuit:'body',squeeze:true}]),
    ['vessel-photo','vesselsDraw',{view:'micrograph',vessel:'artery',circuit:'body'}],
    ['blood','bloodDraw',{task:'flow',view:'smear',component:'rbc'}],
    ['blood-electron','bloodDraw',{task:'flow',view:'em',component:'wbc'}],
    ['blood-focus','bloodDraw',{task:'flow',view:'focus',component:'platelet'}],
    ['repair','bloodDraw',{task:'repair',view:'smear',component:'platelet',repair:.7}],
    ['separated','bloodDraw',{task:'separate',view:'smear',component:'rbc',separation:1,targetSeparation:1}],
    ['pulse-compact','pulseDraw',{view:'pulse'}],['pulse-large','pulseDraw',{view:'pulse'}]
  ];
  for(const lang of ['zh','en']){
    for(const [name,fn,initial] of scenarios){
      const c=createCanvas(960,600),ctx=c.getContext('2d'),hits=[],textBounds=[];
      const s={running:true,...initial};
      if(fn==='pulseDraw')Object.assign(s,{timer:{deadline:12345,done:false},records:{before:{heart:72,pulse:71}},heartCount:7,pulseCount:6});
      const D={tr:p=>Array.isArray(p)?p[lang==='zh'?0:1]:String(p),hit:(...args)=>hits.push(args),status:()=>{},
        image(c,file,x,y,w,h){const im=images[file],scale=Math.min(w/im.width,h/im.height),ww=im.width*scale,hh=im.height*scale,xx=x+(w-ww)/2,yy=y+(h-hh)/2;c.drawImage(im,xx,yy,ww,hh);return{x:xx,y:yy,w:ww,h:hh};},
        focus(c,file,crop,dest){const im=images[file],[a,b,w,h]=crop,[x,y,dw,dh]=dest,scale=Math.min(dw/(im.width*w),dh/(im.height*h)),ww=im.width*w*scale,hh=im.height*h*scale;c.drawImage(im,a*im.width,b*im.height,w*im.width,h*im.height,x+(dw-ww)/2,y+(dh-hh)/2,ww,hh);}
      };
      if(name==='pulse-large')D.pulseBounds={x:36,y:148,w:888,h:310};
      const fill=ctx.fillText.bind(ctx);let textIndex=0,skipIndex=-1;
      ctx.fillText=(str,x,y)=>{const m=ctx.measureText(str),left=x-(ctx.textAlign==='center'?m.width/2:ctx.textAlign==='right'?m.width:0);
        textBounds.push({text:str,left,right:left+m.width,y,size:ctx.font});if(textIndex++!==skipIndex)fill(str,x,y);};
      ctx.fillStyle='#11261f';ctx.fillRect(0,0,960,600);
      api[fn](ctx,s,0,D);
      const steps=fn==='heartDraw'&&initial.auto?30:4;
      for(let i=1;i<=steps;i++)api[fn](ctx,s,i/steps,D);
      const bytes=ctx.getImageData(0,0,960,600).data.slice();
      const before=JSON.stringify({timer:s.timer,records:s.records,heartCount:s.heartCount,pulseCount:s.pulseCount});
      api[fn](ctx,s,1,D);
      if(fn==='pulseDraw')assert.equal(before,JSON.stringify({timer:s.timer,records:s.records,heartCount:s.heartCount,pulseCount:s.pulseCount}));
      for(let i=steps+1;i<=steps*2;i++)api[fn](ctx,s,i/steps,D);
      const after=ctx.getImageData(0,0,960,600).data;let changed=0;
      for(let i=0;i<bytes.length;i+=4)if(bytes[i]!==after[i]||bytes[i+1]!==after[i+1]||bytes[i+2]!==after[i+2])changed++;
      const staticExpected=(fn==='heartDraw'&&initial.auto===false&&(initial.cutawayPhase.startsWith('isovolumetric')||initial.cutawayPhase==='ejection'||initial.cutawayPhase==='filling'||initial.cutawayPhase==='atrial-systole'))||name==='separated';
      if(!staticExpected)assert(changed>100,`${name}/${lang}: nonzero one-second animation difference`);
      const outside=textBounds.filter(p=>p.left<0||p.right>960||p.y>600);
      assert(!outside.length,`${name}/${lang}: text outside canvas: ${JSON.stringify(outside.slice(0,3))}`);
      // Last-frame knockout: every string must contribute visible, contrasting
      // pixels after the complete drawing, including Chinese and English.
      textBounds.length=0;textIndex=0;api[fn](ctx,s,2,D);
      const full=ctx.getImageData(0,0,960,600).data.slice(),labels=textBounds.slice();
      let visibleLabels=0;
      for(let k=0;k<labels.length;k++){
        skipIndex=k;textIndex=0;api[fn](ctx,s,2,D);
        const knocked=ctx.getImageData(0,0,960,600).data;let contrast=0;
        for(let j=0;j<full.length;j+=4)if(Math.abs(full[j]-knocked[j])+Math.abs(full[j+1]-knocked[j+1])+Math.abs(full[j+2]-knocked[j+2])>36)contrast++;
        assert(contrast>12,`${name}/${lang}: invisible text ${labels[k].text}`);visibleLabels++;
      }
      skipIndex=-1;textIndex=0;api[fn](ctx,s,2,D);
      fs.writeFileSync(path.join(out,`${name}-${lang}.png`),c.toBuffer('image/png'));
      report.rendering.push({name,lang,changed,staticExpected,visibleLabels,hitCount:hits.length,outsideText:outside.length});
    }
  }
  report.output=out;report.fonts='Repository Noto Sans TC + JetBrains Mono'+(process.env.CODEX_QA_FONT_DIR?' instantiated at wght=700':' variable-font defaults');
  fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));
}
(async()=>{
  if(process.argv.includes('--render'))await render();
  console.log(JSON.stringify({...report,events:{count:report.events.length,S1:report.events.filter(e=>e.sound==='S1').length,S2:report.events.filter(e=>e.sound==='S2').length},
    rendering:{scenes:report.rendering.length,visibleLabels:report.rendering.reduce((n,r)=>n+r.visibleLabels,0),
      animated:report.rendering.filter(r=>!r.staticExpected).length,staticPhaseOrSettled:report.rendering.filter(r=>r.staticExpected).length,
      textOutsideCanvas:report.rendering.reduce((n,r)=>n+r.outsideText,0)}},null,2));
})().catch(e=>{console.error(e);process.exitCode=1;});
