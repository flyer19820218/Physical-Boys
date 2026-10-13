/* Teacher-authorised branching circulation redraw. One LivingBook clock only.
 * Organ artwork: original transparent AI atlas. Arrows, routes and labels are
 * deterministic code, independently checked against the directed graph below.
 */
(function(root){
  'use strict';
  const P=(zh,en)=>[zh,en], rich='#ef5754', poor='#8e3446', ink='#f2ecd9';
  const mod=n=>((n%10)+10)%10;
  const ORGANS=Object.freeze([
    {id:'heart',name:P('心肌','Heart muscle'),tile:0,y:107,artery:P('冠狀動脈','Coronary arteries'),return:P('冠狀靜脈 → 冠狀竇','Cardiac veins → coronary sinus')},
    {id:'liver',name:P('肝臟','Liver'),tile:2,y:207,artery:P('肝動脈','Hepatic artery'),return:P('肝靜脈 → 下大靜脈','Hepatic veins → inferior vena cava')},
    {id:'intestine',name:P('小腸','Small intestine'),tile:4,y:307,artery:P('腸繫膜動脈','Mesenteric arteries'),return:P('肝門靜脈 → 肝臟 → 肝靜脈 → 下大靜脈','Portal vein → liver → hepatic veins → inferior vena cava')},
    {id:'kidney',name:P('腎臟','Kidney'),tile:3,y:407,artery:P('腎動脈','Renal artery'),return:P('腎靜脈 → 下大靜脈','Renal vein → inferior vena cava')},
    {id:'tissue',name:P('全身組織','Body tissues'),tile:5,y:507,artery:P('各處的動脈支路','Arterial branches'),return:P('靜脈 → 上／下大靜脈','Veins → superior / inferior vena cava')}
  ]);
  const GRAPH=Object.freeze({
    lv:['aorta'],aorta:['coronary','hepaticArtery','mesenteric','renalArtery','bodyArteries'],
    coronary:['heart'],heart:['coronarySinus'],coronarySinus:['ra'],
    hepaticArtery:['liver'],mesenteric:['intestine'],intestine:['portal'],portal:['liver'],liver:['hepaticVeins'],hepaticVeins:['ivc'],
    renalArtery:['kidney'],kidney:['renalVeins'],renalVeins:['ivc'],bodyArteries:['tissue'],tissue:['svc','ivc'],
    svc:['ra'],ivc:['ra'],ra:['rv'],rv:['pa'],pa:['lung'],lung:['pv'],pv:['la'],la:['lv']
  });
  let atlas;
  function artwork(){if(!atlas&&typeof Image!=='undefined'){atlas=new Image();atlas.src='assets/biology/human_transport_media_1012_v1/organ_atlas.png';}return atlas;}
  function icon(ctx,tile,x,y,size){const im=artwork();if(im?.complete&&im.naturalWidth)ctx.drawImage(im,(tile%3)*512,Math.floor(tile/3)*512,512,512,x,y,size,size);}
  function line(ctx,path,color,width=12){ctx.save();ctx.lineWidth=width;ctx.strokeStyle=color;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();path.forEach((p,i)=>ctx[i?'lineTo':'moveTo'](...p));ctx.stroke();ctx.restore();}
  function point(path,u){const lengths=path.slice(1).map((p,i)=>Math.hypot(p[0]-path[i][0],p[1]-path[i][1]));let d=Math.max(0,Math.min(1,u))*lengths.reduce((a,b)=>a+b,0),i=0;while(i<lengths.length-1&&d>lengths[i])d-=lengths[i++];const a=path[i],b=path[i+1],f=lengths[i]?d/lengths[i]:0;return{x:a[0]+(b[0]-a[0])*f,y:a[1]+(b[1]-a[1])*f,angle:Math.atan2(b[1]-a[1],b[0]-a[0])};}
  function cell(ctx,p,oxygen,r=4.5){ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.angle);const u=Math.max(0,Math.min(1,(oxygen-.2)/.8));ctx.fillStyle=`rgb(${Math.round(142+97*u)},${Math.round(52+35*u)},${Math.round(70-16*u)})`;ctx.beginPath();ctx.ellipse(0,0,r*1.3,r,0,0,Math.PI*2);ctx.fill();ctx.fillStyle=oxygen>.6?'#f8b69e':'#c48687';ctx.beginPath();ctx.ellipse(0,0,r*.58,r*.42,0,0,Math.PI*2);ctx.fill();ctx.restore();}
  function arrow(ctx,path,color,u=.65){const p=point(path,u);ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.angle);ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(8,0);ctx.lineTo(-7,-8);ctx.lineTo(-7,8);ctx.closePath();ctx.fill();ctx.restore();}
  function flow(ctx,path,oxygen,t,rate=.045){line(ctx,path,'#ead0a040',17);line(ctx,path,oxygen>.6?'#c64943':'#6f3041',11);const count=Math.max(3,Math.round(path.slice(1).reduce((n,p,i)=>n+Math.hypot(p[0]-path[i][0],p[1]-path[i][1]),0)/24));for(let i=0;i<count;i++)cell(ctx,point(path,((t*rate+i/count)%1+1)%1),oxygen);arrow(ctx,path,ink);}
  function text(ctx,D,p,x,y,size=22,align='left',color=ink){ctx.save();ctx.font=`700 ${size}px "Noto Sans TC", "JetBrains Mono", sans-serif`;ctx.textAlign=align;ctx.fillStyle=color;ctx.fillText(D.tr(p),x,y);ctx.restore();}
  function fitText(ctx,str,width,floor=22){
    // Fixed-size cards: measure first, wrap instead of shrinking below 22px.
    ctx.save();ctx.font=`700 ${floor}px "Noto Sans TC", "JetBrains Mono", sans-serif`;
    const units=/\s/.test(str)?str.split(/\s+/).map(a=>a+' '):Array.from(str),rows=[];let row='';
    for(const unit of units){if(row&&ctx.measureText(row+unit).width>width){rows.push(row.trim());row=unit;}else row+=unit;}if(row)rows.push(row.trim());ctx.restore();
    return rows;
  }
  function card(ctx,D,p,x,y,w,h,tile,active){
    D.round(ctx,x,y,w,h,13,active?'#315847':'#193b31',active?'#fde047':'#638979');
    if(tile!==null)icon(ctx,tile,x+2,y+3,h-6);
    const start=tile===null?x+8:x+h+7,available=x+w-8-start;
    const rows=fitText(ctx,D.tr(p),available,22);
    const top=y+h/2-(rows.length-1)*13+8;
    rows.forEach((r,i)=>text(ctx,D,[r,r],tile===null?x+w/2:start,top+i*26,22,tile===null?'center':'left'));
  }
  // A real T-junction below the caval turn, shared by the liver and portal route.
  // The hepatic return no longer doubles back through the cava or ends above it.
  const HEPATIC_RETURN=Object.freeze([[492,207],[564,207],[564,246],[614,246]]);
  const CAVA_RETURN=Object.freeze([[614,507],[614,212],[758,212]]);
  function paths(organ){
    const y=organ.y;
    const outlet=organ.id==='heart'?[[492,y],[660,y],[660,196],[758,196]]:
      organ.id==='intestine'?[[492,y],[534,y],[534,227],[492,227],[510,207],...HEPATIC_RETURN.slice(1)]:
      organ.id==='liver'?HEPATIC_RETURN:
      [[492,y],[614,y],[614,386]];
    const cava=organ.id==='heart'?[758,196]:organ.id==='liver'||organ.id==='intestine'?HEPATIC_RETURN.at(-1):[614,386];
    return [
      [[164,280],[214,280]],
      [[214,280],[214,y],[284,y],[388,y]],
      [[388,y],...outlet],
      organ.id==='heart'?[cava,[844,212]]:[cava,[614,212],[758,212],[844,212]],
      [[844,212],[844,310]],
      [[844,310],[942,310],[942,366]],
      [[942,366],[942,410],[844,410]],
      [[844,410],[736,410],[736,466]],
      [[736,466],[736,508],[844,508]],
      [[844,508],[844,577],[100,577],[100,280]]
    ];
  }
  const memories=new WeakMap();
  function draw(ctx,s,t,D){
    const prior=memories.get(s);memories.set(s,t);if(s.running&&prior!==undefined&&t>=prior)s.travel=mod(s.travel+Math.min(.25,t-prior)*.24*s.speed);
    const organ=ORGANS.find(o=>o.id===s.organ)||ORGANS[4], stage=Math.floor(mod(s.travel));
    text(ctx,D,P('左心室出發：分支供血，再匯回心臟','From the left ventricle: branch out, then return'),24,35,26);
    text(ctx,D,P('鮮紅：較多氧','Bright red: more O₂'),601,68,20,'left',rich);
    text(ctx,D,P('暗紅：較少氧','Dark red: less O₂'),601,95,20,'left','#df8794');
    flow(ctx,[[164,280],[214,280],[214,107]],1,t);flow(ctx,[[214,280],[214,507]],1,t);
    flow(ctx,CAVA_RETURN,.2,t);
    for(const o of ORGANS){flow(ctx,[[214,o.y],[284,o.y]],1,t);if(o.id==='heart')flow(ctx,[[492,107],[660,107],[660,196],[758,196]],.2,t);else if(o.id==='liver')flow(ctx,HEPATIC_RETURN,.2,t);else if(o.id!=='intestine')flow(ctx,[[492,o.y],[614,o.y],[614,386]],.2,t);}
    flow(ctx,[[492,307],[534,307],[534,227],[492,227]],.2,t);
    flow(ctx,[[844,248],[844,278]],.2,t);
    flow(ctx,[[930,310],[942,310],[942,410],[930,410]],.2,t);
    flow(ctx,[[758,410],[736,410],[736,508],[758,508]],1,t);
    flow(ctx,[[844,540],[844,577],[100,577],[100,322]],1,t);
    card(ctx,D,P('左心室','Left ventricle'),28,238,136,84,null,stage===0);
    text(ctx,D,P('主動脈','Aorta'),214,76,22,'center','#ff9c83');
    for(const o of ORGANS){card(ctx,D,o.name,284,o.y-39,208,78,o.tile,o.id===organ.id&&stage===2);D.hit(284,o.y-39,208,78,'organ',o.id);}
    D.round(ctx,565,344,143,90,12,'#193b31',stage===3?'#fde047':'#638979');
    text(ctx,D,P('上／下','Superior /'),636,377,22,'center');text(ctx,D,P('大靜脈','inferior cava'),636,407,22,'center');
    text(ctx,D,P('冠狀竇','Coronary sinus'),665,145,18,'center','#e597a5');
    text(ctx,D,P('肝靜脈','Hepatic veins'),550,185,22,'left','#e597a5');
    text(ctx,D,P('肝門靜脈','Portal vein'),538,270,18,'left','#e597a5');
    card(ctx,D,P('右心房','Right atrium'),758,180,172,68,null,stage===4);
    card(ctx,D,P('右心室','Right ventricle'),758,278,172,68,null,stage===5);
    card(ctx,D,P('肺','Lungs'),758,373,172,74,1,stage===7);
    card(ctx,D,P('左心房','Left atrium'),758,474,172,68,null,stage===9);
    text(ctx,D,P('肺動脈','Pulmonary artery'),852,367,20,'center','#df8794');
    text(ctx,D,P('肺靜脈','Pulmonary vein'),735,461,20,'right','#ff9c83');
    const route=paths(organ),f=mod(s.travel)-stage,p=point(route[stage],f);
    const oxygen=stage<=1?1:stage===2?1-f*.8:stage<=6?.2:stage===7?.2+f*.8:1;
    cell(ctx,p,oxygen,7);ctx.save();ctx.strokeStyle='#fde047';ctx.lineWidth=3;ctx.beginPath();ctx.arc(p.x,p.y,11,0,Math.PI*2);ctx.stroke();ctx.restore();
    s.branchTrace={organ:organ.id,stage,oxygen,x:p.x,y:p.y};
    D.hit(28,238,136,84,'station',0);D.hit(758,180,172,68,'station',4);D.hit(758,278,172,68,'station',5);D.hit(758,373,172,74,'station',7);D.hit(758,474,172,68,'station',9);
    D.status(P('點器官選支路；黃圈追蹤一顆紅血球。','Choose an organ route. The yellow ring follows one red cell.'));
  }
  function explain(s){const o=ORGANS.find(o=>o.id===s.organ)||ORGANS[4];return{
    title:P(`${o.name[0]}支路：從左心室，回到左心室`,`${o.name[1]} route: left ventricle back to left ventricle`),
    text:P(`左心室 → 主動脈 → ${o.artery[0]} → ${o.name[0]}的微血管 → ${o.return[0]} → 右心房 → 右心室 → 肺動脈 → 肺微血管補氧 → 肺靜脈 → 左心房 → 左心室。\n\n各器官不是排隊串在一起：血液分走不同支路。器官、管徑與時間為示意；鮮紅／暗紅表示相對含氧量，沒有藍色血液。`,
    `Left ventricle → aorta → ${o.artery[1]} → ${o.name[1]} capillaries → ${o.return[1]} → right atrium → right ventricle → pulmonary artery → lung capillaries (gain oxygen) → pulmonary veins → left atrium → left ventricle.\n\nOrgans are not one long queue: blood follows separate branches. Organs, vessel widths and travel times are illustrative. Bright/dark red show relative oxygen; blood is not blue.`)
  };}
  root.HumanTransportCirculation=Object.freeze({draw,explain,organs:ORGANS,graph:GRAPH,paths,point,geometry:Object.freeze({hepaticReturn:HEPATIC_RETURN,cavaReturn:CAVA_RETURN})});
})(globalThis);
