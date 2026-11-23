// usage（先 mkdir -p /tmp/ht3d_verify；先 bash tools/qa/serve.sh 開 8765 埠）: node ht3d_lshot.cjs "<step>:<ms>,<step>:<ms>" prefix [w h dpr]
const pw=(()=>{for(const m of ['playwright','/opt/node22/lib/node_modules/playwright']){try{return require(m)}catch(e){}}})();
const fs=require('fs');const BASE='http://127.0.0.1:8765/';
const [,, spec, prefix, W='430', H='900', DPR='2']=process.argv;
(async()=>{
 const b='/opt/pw-browsers';const exe=(()=>{for(const d of fs.readdirSync(b).sort().reverse()){const p=b+'/'+d+'/chrome-linux/chrome';if(d.startsWith('chromium')&&fs.existsSync(p))return p}})();
 const br=await pw.chromium.launch({executablePath:exe,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--use-gl=angle']});
 const ctx=await br.newContext({viewport:{width:+W,height:+H},isMobile:false,hasTouch:true,deviceScaleFactor:+DPR});const p=await ctx.newPage();
 const errs=[];p.on('pageerror',e=>errs.push(String(e)));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
 await p.goto(BASE+'biology_human_transport.html?q='+Date.now());await p.waitForTimeout(1500);
 const i=await p.$('#introScreen');if(i){await i.tap().catch(()=>{});await p.waitForTimeout(1000)}
 await p.locator('.tab-btn').nth(3).tap();await p.waitForTimeout(600);
 await p.locator('.ht3d-tbtn[data-v="3d"]').tap();await p.waitForTimeout(9000);
 for(const it of spec.split(',')){const [st,ms]=it.split(':').map(Number);
  await p.evaluate(async ([a,c])=>{await window.HT3D.go('liver',a,c,{after:'stop'});window.HT3D.pause();},[st,ms]);await p.waitForTimeout(2500);
  const bb={};await p.evaluate(()=>{const e=document.querySelector('.ht3d-stage canvas')||document.querySelector('.ht3d-stage');e.scrollIntoView({block:'center',behavior:'instant'});return 1});await p.waitForTimeout(1500);const bb2=await p.evaluate(()=>{const e=document.querySelector('.ht3d-stage canvas')||document.querySelector('.ht3d-stage');const r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height}});Object.assign(bb,bb2);
  const f=`/tmp/ht3d_verify/${prefix}_s${st}_${ms}.png`;await p.screenshot({path:f});require('fs').writeFileSync(f+'.json',JSON.stringify({bb,dpr:+DPR}));const stt=await p.evaluate(()=>{const g=window.HT3D.getState();return {particles:g.particles,step:g.step,lite:g.lite}});console.log(f,JSON.stringify(bb),JSON.stringify(stt));
 }
 console.log('errors',JSON.stringify(errs.slice(0,5)));await br.close();
})();
