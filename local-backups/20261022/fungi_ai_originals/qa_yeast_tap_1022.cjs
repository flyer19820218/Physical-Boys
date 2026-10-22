const {launch,BASE}=require('../../../tools/qa/lib.cjs');
(async()=>{const b=await launch();const p=await (await b.newContext({viewport:{width:1366,height:1024}})).newPage();
await p.goto(BASE+'biology_fungi.html');await p.waitForTimeout(1200);await p.click('#introScreen').catch(()=>{});await p.waitForTimeout(800);
await p.evaluate(()=>window.LivingBook.setTab(1));await p.waitForTimeout(500);await p.evaluate(()=>window.LivingBook.action('phase',1));await p.waitForTimeout(800);
await p.evaluate(()=>document.getElementById('lessonCanvas').scrollIntoView({block:'center'}));await p.waitForTimeout(400);const box=await (await p.$('#lessonCanvas')).boundingBox();const at=(x,y)=>p.mouse.click(box.x+x*box.width/960,box.y+y*box.height/600);
await at(790,350);await p.waitForTimeout(300);console.log('after tap C: guess=',await p.evaluate(()=>window.LivingBook.getState().guess));
await at(878,566);await p.waitForTimeout(300);console.log('after tap marker 3: phase=',await p.evaluate(()=>window.LivingBook.getState().phase));
const h=await p.evaluate(()=>[...document.querySelectorAll('button')].filter(b=>/A 瓶|B 瓶|C 瓶|看結果/.test(b.textContent)).map(b=>b.textContent+':'+Math.round(b.getBoundingClientRect().height)));console.log('control heights',h);
await b.close();})();
