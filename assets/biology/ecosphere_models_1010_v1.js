/* New, additive ecology teaching models. 960 x 600. No original artwork modified.
 * Time belongs to LivingBook; draw is pure with respect to supplied state.
 * Textbook pictures are optional and appear only in a separate original view.
 */
(() => {
  'use strict';
  const P = (zh, en) => [zh, en];
  const C = { bg:'#11261f', panel:'#1c3d34', white:'#f2ecd9', green:'#4ade80', blue:'#55e9ff', yellow:'#fde047', orange:'#fb923c', pink:'#f472b6', muted:'#91b5a6' };
  const clamp = (n,a,b) => Math.max(a,Math.min(b,n));
  const finite = (n,fallback=0) => Number.isFinite(Number(n)) ? Number(n) : fallback;
  const fmt = n => Number.isFinite(n) ? String(Math.round(n*100)/100) : '—';
  const item = (label,key,value) => ({label,key,value});
  const group = (label,items) => ({label,items});
  const choices = (label,key,labels,values) => group(label,labels.map((p,i)=>item(p,key,values ? values[i] : i)));
  const numeric = (label,key,min,max,step=1) => ({label,key,input:{type:'number',min,max,step}});
  const pick = (pairs,n) => pairs[clamp(Math.round(finite(n)),0,pairs.length-1)];
  const elapsed = s => Math.max(0,finite(s.elapsed));
  const MODEL = P('新增教學模型｜非照片・示意，非實測','Added teaching model | Not a photo; schematic, not measured');

  // Exported pure helpers are shared with the independent science/maths checks.
  function quadratEstimate(counts,area,quadratArea=1) {
    if (!counts.length || area<=0 || quadratArea<=0 || counts.some(n=>!Number.isFinite(n)||n<0)) return null;
    const mean=counts.reduce((a,b)=>a+b,0)/counts.length;
    return {mean,density:mean/quadratArea,total:mean*area/quadratArea};
  }
  function markRecapture(M,Caught,R) {
    if (![M,Caught,R].every(Number.isFinite) || M<=0 || Caught<=0 || R<=0 || R>M || R>Caught) return null;
    return M*Caught/R;
  }
  function populationBalance(n,b,d,i,e) { return {delta:b+i-d-e,next:Math.max(0,n+b+i-d-e),valid:d+e<=n+b+i}; }
  function energyBudget(input,efficiency) {
    const e=clamp(efficiency,0,1),levels=[input,input*e,input*e*e];
    return {levels,notTransferred:[input*(1-e),input*e*(1-e)]};
  }
  function concentrations(base,factor,levels=4) { return Array.from({length:levels},(_,i)=>base*factor**i); }
  function rotate3(p,yaw=0,pitch=0) {
    const ca=Math.cos(yaw),sa=Math.sin(yaw),cb=Math.cos(pitch),sb=Math.sin(pitch);
    const x=p[0]*ca+p[2]*sa,z=-p[0]*sa+p[2]*ca;
    return [x,p[1]*cb-z*sb,p[1]*sb+z*cb];
  }
  function project3(p,yaw=0,pitch=.55,cx=480,cy=330,scale=1) {
    const q=rotate3(p,yaw,pitch),depth=1050-q[2],k=700/Math.max(200,depth)*scale;
    return {x:cx+q[0]*k,y:cy-q[1]*k,z:q[2],scale:k,depth};
  }
  function sortedFaces(faces,yaw,pitch) {
    return faces.map((f,index)=>({...f,index,depth:f.points.reduce((a,p)=>a+rotate3(p,yaw,pitch)[2],0)/f.points.length})).sort((a,b)=>a.depth-b.depth || a.index-b.index);
  }
  function prism(x,y,z,w,h,d,color) {
    const v=[[x,y,z],[x+w,y,z],[x+w,y+h,z],[x,y+h,z],[x,y,z+d],[x+w,y,z+d],[x+w,y+h,z+d],[x,y+h,z+d]];
    return [[0,1,2,3],[4,7,6,5],[0,4,5,1],[3,2,6,7],[0,3,7,4],[1,5,6,2]].map((ix,i)=>({points:ix.map(k=>v[k]),color,shade:[.72,.88,.62,1,.78,.9][i]}));
  }
  function slab3(x,y,z,w,h,d,color) {
    // A single giant top face cannot occlude objects correctly under painter sorting.
    // Split the top into short world-space tiles before the shared depth sort.
    const faces=prism(x,y,z,w,h,d,color).filter((_,i)=>i!==3),nx=Math.ceil(w/55),nz=Math.ceil(d/50);
    for(let i=0;i<nx;i++)for(let j=0;j<nz;j++){
      const a=x+w*i/nx,b=x+w*(i+1)/nx,c=z+d*j/nz,e=z+d*(j+1)/nz;
      faces.push({points:[[a,y+h,c],[b,y+h,c],[b,y+h,e],[a,y+h,e]],color});
    }
    return faces;
  }
  function sphereMesh(center,r,color,rows=10,cols=20) {
    const out=[],point=(a,b)=>[center[0]+r*Math.cos(a)*Math.cos(b),center[1]+r*Math.sin(a),center[2]+r*Math.cos(a)*Math.sin(b)];
    for(let i=0;i<rows;i++) for(let j=0;j<cols;j++) {
      const a=-Math.PI/2+i*Math.PI/rows,b=j*2*Math.PI/cols;
      out.push({points:[point(a,b),point(a+Math.PI/rows,b),point(a+Math.PI/rows,b+2*Math.PI/cols),point(a,b+2*Math.PI/cols)],color:typeof color==='function'?color(i,j):color,shade:.64+.36*(i/rows)});
    }
    return out;
  }
  function tint(hex,k) {
    const v=hex.slice(1).match(/../g).map(s=>Math.round(parseInt(s,16)*k));
    return `rgb(${v.join(',')})`;
  }
  function render3(c,faces,s,t,options={}) {
    const yaw=(s.angle||0)*Math.PI/180+(s.spin===false?0:t*.11),pitch=(s.pitch||32)*Math.PI/180;
    for(const face of sortedFaces(faces,yaw,pitch)) {
      const ps=face.points.map(p=>project3(p,yaw,pitch,480,options.cy||325,options.scale||1));
      c.beginPath();ps.forEach((p,i)=>c[i?'lineTo':'moveTo'](p.x,p.y));c.closePath();
      c.fillStyle=tint(face.color,face.shade??1);c.fill();
      if(face.edge){c.strokeStyle=face.edge;c.lineWidth=1;c.stroke();}
    }
  }
  function tree3(x,z,height=80,color='#4ade80',y=0) {
    const faces=prism(x-4,y,z-4,8,height*.65,8,'#a4774d'),r=height*.28,top=[x,y+height,z];
    const base=Array.from({length:6},(_,i)=>[x+r*Math.cos(i*Math.PI/3),y+height*.35,z+r*Math.sin(i*Math.PI/3)]);
    for(let i=0;i<6;i++)faces.push({points:[base[i],base[(i+1)%6],top],color,shade:.64+i*.055});
    return faces;
  }
  function landscape({water=false,fragment=false,corridor=false,trees=22,height=75,variety=false,low=false}={}) {
    let faces=slab3(-330,-24,-205,660,24,410,low?'#a58c61':'#568b58');
    if(water)faces.push(...slab3(-55,1,-205,135,3,410,'#379aaa'));
    if(fragment)faces.push(...slab3(-42,1,-205,84,3,410,'#7d8785'));
    if(fragment&&corridor)faces.push(...slab3(-94,9,-36,188,20,72,'#75b65b'));
    for(let i=0;i<trees;i++) {
      let x=-292+((i*137)%580),z=-167+((i*97)%330);
      if((water||fragment)&&Math.abs(x)<105)x+=x<0?-110:110;
      faces.push(...tree3(x,z,height*(.7+(i%4)*.12),variety?[C.green,'#9ac950','#40977e'][i%3]:'#4ade80'));
    }
    return faces;
  }
  const rotationControls = s => group(P('旋轉觀察','Rotate the model'),[
    item(P('左轉 30°','Turn left 30°'),'angle',(s.angle||0)-30),item(P('右轉 30°','Turn right 30°'),'angle',(s.angle||0)+30),
    item(P('低視角','Low view'),'pitch',20),item(P('俯視','Higher view'),'pitch',55),item(s.spin===false?P('自動轉動','Auto rotate'):P('固定視角','Hold view'),'spin',s.spin===false)
  ]);
  function text(c,D,p,x,y,w=880,size=24,color=C.white) { return D.wrap(c,p,x,y,w,{size,line:size+9,color}); }
  function frame(c,D,title) { c.fillStyle=C.bg;c.fillRect(0,0,960,600);text(c,D,title,28,38,904,26,C.yellow); }
  function footer(c,D,p=MODEL) { text(c,D,p,28,560,904,22,C.muted); }
  function dot(c,x,y,r,color) {c.fillStyle=color;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();}
  function line(c,ps,color=C.blue,width=3) {c.beginPath();ps.forEach((p,i)=>c[i?'lineTo':'moveTo'](...p));c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.stroke();}
  function arrow(c,a,b,color=C.blue,width=4) {line(c,[a,b],color,width);const ang=Math.atan2(b[1]-a[1],b[0]-a[0]);c.beginPath();c.moveTo(...b);c.lineTo(b[0]-14*Math.cos(ang-.45),b[1]-14*Math.sin(ang-.45));c.lineTo(b[0]-14*Math.cos(ang+.45),b[1]-14*Math.sin(ang+.45));c.closePath();c.fillStyle=color;c.fill();}
  function flow(c,a,b,t,color=C.yellow,count=3) {arrow(c,a,b,color);for(let i=0;i<count;i++){const q=(t*.18+i/count)%1;dot(c,a[0]+(b[0]-a[0])*q,a[1]+(b[1]-a[1])*q,6,color);}}
  function box(c,D,p,x,y,w=220,h=92,color=C.blue) {D.round(c,x,y,w,h,14,C.panel,color);text(c,D,p,x+15,y+32,w-30,24,color);}
  function figure(c,x,y,kind,color=C.green,scale=1) {
    c.save();c.translate(x,y);c.scale(scale,scale);c.fillStyle=color;c.strokeStyle=color;c.lineWidth=4;
    if(kind===0){line(c,[[0,24],[0,-22]],color,5);c.beginPath();c.ellipse(-12,-5,18,9,-.5,0,Math.PI*2);c.ellipse(13,-16,18,9,.5,0,Math.PI*2);c.fill();}
    else if(kind===1){c.beginPath();c.ellipse(0,0,25,16,0,0,Math.PI*2);c.fill();c.beginPath();c.moveTo(-23,0);c.lineTo(-40,-17);c.lineTo(-40,17);c.closePath();c.fill();dot(c,13,-4,3,C.bg);}
    else if(kind===2){c.beginPath();c.ellipse(0,5,22,16,0,0,Math.PI*2);c.fill();dot(c,18,-9,11,color);line(c,[[12,-18],[9,-37]],color,7);line(c,[[22,-18],[25,-37]],color,7);dot(c,23,-11,2.8,C.bg);}
    else if(kind===4){c.beginPath();c.ellipse(0,5,23,14,0,0,Math.PI*2);c.fill();dot(c,18,-3,10,color);dot(c,13,-13,7,color);dot(c,24,-11,6,color);line(c,[[-22,8],[-36,14],[-47,8]],color,3);dot(c,23,-3,2.8,C.bg);}
    else {line(c,[[-35,4],[-10,-12],[0,0],[13,-12],[37,4]],color,6);dot(c,0,0,7,color);}
    c.restore();
  }
  function make(o,def) {
    o=o||{};const pics=o.pics||[],selected=s=>pics[clamp(Math.round(finite(s.photo)),0,pics.length-1)];
    return {...o,modelKind:def.kind,init:()=>({running:true,elapsed:0,view:0,photo:0,angle:0,pitch:32,spin:true,...def.initial,...(o.initial||{})}),
      sources:o.sources!==undefined?o.sources:pics.map(p=>({name:p.name,page:p.page})),
      controls(s){const gs=s.view===1&&pics.length?[]:def.controls(s);if(s.view===1&&pics.length>1)gs.push(choices(P('原圖比較','Compare originals'),'photo',pics.map(q=>q.name)));if(s.view!==1&&(typeof def.three==='function'?def.three(s):def.three))gs.push(rotationControls(s));if(pics.length)gs.unshift(choices(P('圖像','Image view'),'view',[P('互動模型','Interactive model'),P('課本原圖','Textbook original')]));return gs;},
      act(s,key,value){
        if(key==='view'){s.view=Number(value)===1&&pics.length?1:0;return;}
        if(key==='photo'){s.photo=clamp(Math.round(finite(value)),0,pics.length-1);return;}
        if(key==='angle'){s.angle=((finite(value)%360)+360)%360;return;}
        if(key==='pitch'){s.pitch=clamp(finite(value,32),15,60);return;}
        if(key==='spin'){s.spin=!!value;return;}
        if(def.act)def.act(s,key,value);
      },
      draw(c,s,time,D){
        c.save();
        if(s.view===1&&pics.length){
          const p=selected(s);c.fillStyle=C.bg;c.fillRect(0,0,960,600);text(c,D,p.name,28,36,904,24,C.yellow);
          D.image(c,p.file,24,84,912,426);
          text(c,D,P(`課本原圖｜第 ${p.page} 頁・獨立顯示，未疊加模型`,`Textbook original | p. ${p.page}; displayed separately`),28,552,904,22,C.muted);
        }else def.draw(c,s,Math.max(0,finite(time)),D);
        c.restore();
      },
      explain(s){if(s.view===1&&pics.length){const p=selected(s);return {title:p.name,text:p.text||P('觀察課本原圖，再切回模型比較。原圖依老師回報的康軒使用同意提供，非開放授權。','Observe the textbook original, then compare with the model. Permission is reported by the teacher; this is not an open licence.')};}return def.explain(s);}
    };
  }
  const setChoice=(s,k,v,ranges)=>{if(Object.hasOwn(ranges,k)){const [a,b]=ranges[k];s[k]=clamp(Math.round(finite(v,a)),a,b);s.elapsed=0;}};

  const levels=[P('個體','Individual'),P('族群','Population'),P('群集','Community'),P('生態系','Ecosystem')];
  function biosphere(o) {return make(o,{kind:'biosphere',three:true,initial:{mode:0,level:3,thin:0},
    controls:s=>[choices(P('觀察主題','Explore'),'mode',[P('地球薄層','Earth’s thin living layer'),P('組成層次','Levels of organisation')]),s.mode?choices(P('組成','Composition'),'level',levels):choices(P('薄層顯示','Layer display'),'thin',[P('接近比例','Near scale'),P('誇張厚度','Exaggerated thickness')])],
    act:(s,k,v)=>setChoice(s,k,v,{mode:[0,1],level:[0,3],thin:[0,1]}),
    draw(c,s,t,D){frame(c,D,s.mode?P('同時、同地：觀察包含了誰？','Same time and place: what is included?'):P('生命活動集中在地表附近的薄層','Life occupies a thin layer near Earth’s surface'));
      if(!s.mode){
        const faces=sphereMesh([0,0,0],225,(i,j)=>((Math.sin(j*.74+i*.9)+Math.cos(j*.5-i))>.45?'#54966a':'#307994'),14,28);
        const r=s.thin?245:225*(1+10/6370);
        // Rings have genuine world coordinates; hidden halves are occluded by the opaque globe.
        for(let lat=-2;lat<=2;lat++)for(let j=0;j<80;j++){
          const a=lat*.43,b=j*Math.PI/40,b2=(j+1)*Math.PI/40,dr=s.thin?2.2:.75;
          faces.push({points:[[r*Math.cos(a)*Math.cos(b),r*Math.sin(a),r*Math.cos(a)*Math.sin(b)],[(r+dr)*Math.cos(a)*Math.cos(b),(r+dr)*Math.sin(a),(r+dr)*Math.cos(a)*Math.sin(b)],[(r+dr)*Math.cos(a)*Math.cos(b2),(r+dr)*Math.sin(a),(r+dr)*Math.cos(a)*Math.sin(b2)],[r*Math.cos(a)*Math.cos(b2),r*Math.sin(a),r*Math.cos(a)*Math.sin(b2)]],color:C.yellow});
        }
        render3(c,faces,s,t,{scale:1.16,cy:291});text(c,D,s.thin?P('黃線：範圍誇張顯示','Yellow: exaggerated living layer'):P('接近比例時，薄層幾乎看不見','Near scale, the layer is barely visible'),28,505,904,24,C.blue);
      }else{
        let faces=s.level===3?landscape({water:true,trees:8}):[];
        const count=s.level===0?1:8;
        for(let i=0;i<count;i++)faces.push(...sphereMesh([-215+(i%4)*145,25, -85+Math.floor(i/4)*170],17,C.orange,5,8));
        if(s.level>=2){if(s.level===2)for(let i=0;i<8;i++)faces.push(...tree3(-265+(i%4)*165,-150+Math.floor(i/4)*295,100));for(let i=0;i<5;i++)faces.push(...sphereMesh([-210+i*95,125+Math.sin(t+i)*10,30],12,C.pink,4,6));}
        render3(c,faces,s,t,{scale:1.12});text(c,D,levels[s.level],28,486,904,28,C.blue);
      }footer(c,D);
    },
    explain(s){return {title:s.mode?levels[s.level]:P('薄，不等於有固定邊界','Thin does not mean a fixed boundary'),text:s.mode?[
      P('只看一個生物個體，例如某一隻松鼠。切到族群時，再問有哪些個體必須同時、同地而且同種。旋轉是觀察角度的改變，不是個體的實際移動；符號不表示特定物種的真實形態。','Focus on one organism, such as one squirrel. Switch to population and ask which individuals share the same time, area and species. Rotation changes the viewing angle, not the organism’s movement; symbols do not depict a particular species.'),
      P('同時期、同一地區、同種生物的個體集合構成族群。畫面橘色球代表同一種生物，不能把不同物種合稱一個族群。試著用校園的一種植物舉例，說明你選定的觀察範圍與時間。','A population contains individuals of the same species in the same area at the same time. Orange spheres represent one species; different species do not form one population. Use one schoolyard plant species as an example, stating your survey area and time.'),
      P('群集包含同時、同地的各種生物族群。新增的植物與鳥形符號代表其他物種；此層次著重生物組成，水、光、土壤尚未納入群集。比較下一層生態系，指出增加的是哪些非生物條件。','A community includes the populations of different species living together. Plants and bird symbols represent other species. Water, light and soil are not part of the community itself. Compare with the ecosystem level and identify the added nonliving conditions.'),
      P('群集加上水、光、溫度、土壤等非生物環境及彼此作用，構成生態系。旋轉觀察水域與陸域；模型的樹木與球體是類別符號，不是採集數據。','An ecosystem includes the community, nonliving factors such as water, light, temperature and soil, and their interactions. Rotate to inspect land and water; trees and spheres are category symbols, not survey data.')
    ][s.level]:P(`課本以海平面上下各約 10 km、合計約 20 km 描述生物活動的概略薄層；不是每一處都充滿生命，也不是固定界線。地球半徑採課本約 6370 km。${s.thin?'目前特意誇張厚度，方便觀察。':'接近尺度的薄層幾乎無法從整顆地球上分辨。'}黃線只是範圍提示，不是地理分布圖。`,`The textbook describes a roughly 20 km living layer, about 10 km above and below sea level, not a fixed boundary or a uniformly inhabited shell. The reference Earth radius is about 6370 km. ${s.thin?'Thickness is deliberately exaggerated for inspection.':'At near scale the layer is barely distinguishable on the globe.'} Yellow lines indicate the concept, not a geographical distribution map.`)};}
  });}

  const sampleCounts=[4,5,3,2,6,4,5,3];
  function sampleIndices(n,trial){return Array.from({length:n},(_,i)=>(i*3+trial)%8);}
  function sampling(o){return make(o,{kind:'sampling',initial:{method:0,n:3,trial:0,M:20,caught:20,R:5,assumption:0},
    controls:s=>[choices(P('估算方法','Estimation method'),'method',[P('樣區','Quadrats'),P('捉放','Mark–recapture')]),...(s.method===0?[
      choices(P('等面積樣區數','Number of equal quadrats'),'n',[P('2 區','2 quadrats'),P('3 區','3 quadrats'),P('5 區','5 quadrats')],[2,3,5]),group(P('重新抽樣','Resample'),[item(P('換一組樣區','Another sample'),'trial',s.trial+1)])
    ]:[group(P('輸入教學例值','Enter teaching values'),[numeric(P('初次標記 M','First marked M'),'M',1,60),numeric(P('再捕總數 C','Second catch C'),'caught',1,60),numeric(P('其中標記 R','Marked recaptures R'),'R',0,60)]),choices(P('估算假設','Assumptions'),'assumption',[P('混合且封閉','Mixed and closed'),P('標記個體較易被捕','Marked animals easier to catch')])])],
    act(s,k,v){if(k==='trial'){s.trial=(s.trial+1)%8;s.elapsed=0;}else setChoice(s,k,v,{method:[0,1],n:[2,5],M:[1,60],caught:[1,60],R:[0,60],assumption:[0,1]});},
    draw(c,s,t,D){frame(c,D,s.method?P('標記比例，能推回總數嗎？','Can a marked fraction estimate the total?'):P('先算平均，再依面積換算','Find the mean, then scale by area'));
      if(!s.method){const ids=sampleIndices(s.n,s.trial),q=quadratEstimate(ids.map(i=>sampleCounts[i]),8);
        for(let i=0;i<8;i++){const x=45+(i%4)*220,y=104+Math.floor(i/4)*176;D.round(c,x,y,205,156,8,C.panel,ids.includes(i)?C.yellow:C.muted);for(let j=0;j<sampleCounts[i];j++)figure(c,x+35+(j%3)*65,y+50+Math.floor(j/3)*55,0,C.green,.63);D.text(c,P(`${sampleCounts[i]} 株`,`${sampleCounts[i]} plants`),x+110,y+140,{align:'center',size:22});if(ids.includes(i))dot(c,x+12+((t*60)%175),y+9,5,C.yellow);}
        text(c,D,P(`平均 ${fmt(q.mean)} 株／區 × 8 區 ≈ ${fmt(q.total)} 株`,`Mean ${fmt(q.mean)} plants/quadrat × 8 quadrats ≈ ${fmt(q.total)} plants`),36,493,888,26,C.yellow);
      }else{
        const valid=markRecapture(s.M,s.caught,s.R),cols=10;
        box(c,D,P(`初次標記：${s.M}`,`Initially marked: ${s.M}`),35,91,330,100,C.yellow);
        text(c,D,P('再捕樣本：黃色＝有標記','Second catch: yellow = marked'),400,104,515,24,C.blue);
        for(let i=0;i<s.caught;i++){const x=424+(i%cols)*49,y=168+Math.floor(i/cols)*45;dot(c,x+Math.sin(t*2+i)*3,y,12,i<s.R?C.yellow:C.blue);}
        text(c,D,P(`M × C ÷ R = ${s.M} × ${s.caught} ÷ ${s.R}`,`M × C ÷ R = ${s.M} × ${s.caught} ÷ ${s.R}`),35,267,340,26);
        text(c,D,valid===null?P('資料不足或不合理，不能估算','Insufficient or inconsistent data; no estimate'):P(`估算總數 ≈ ${fmt(valid)}`,`Estimated total ≈ ${fmt(valid)}`),35,376,340,26,C.yellow);
        text(c,D,s.assumption?P('假設失效：標記會影響捕捉機率','Assumption fails: marking affects capture'):P('假設：充分混合、短期封閉、等捕捉機率','Assume mixing, closure and equal capture chance'),35,493,890,24,C.orange);
      }footer(c,D);
    },
    explain(s){if(!s.method){const counts=sampleIndices(s.n,s.trial).map(i=>sampleCounts[i]),q=quadratEstimate(counts,8);return {title:P('平均密度不等於整區總數','Mean density is not the total'),text:P(`本次抽到 ${counts.join('、')} 株，共 ${s.n} 個等面積樣區，平均 ${fmt(q.mean)} 株／區；研究區有 8 倍樣區面積，因此估算約 ${fmt(q.total)} 株。全部點數的教學真值是 32 株，可比較估算誤差。換一組樣區會改變估計；實地應隨機、具代表性地取樣，不能只挑植物多的位置。畫面使用固定的示例抽樣組合，不是現場隨機試驗。`,`This sample contains ${counts.join(', ')} plants across ${s.n} equal quadrats: mean ${fmt(q.mean)} plants/quadrat. The whole site has eight times one quadrat’s area, so the estimate is ${fmt(q.total)} plants. The teaching population actually contains 32. Compare the error across samples. Field quadrats should be random and representative, not chosen for high counts. This display cycles through preset sample combinations, not a field random trial.`)};}
      const n=markRecapture(s.M,s.caught,s.R);return {title:P('先檢查假設，才解讀估計值','Check assumptions before interpreting the estimate'),text:P(`初次標記 M=${s.M}、再捕 C=${s.caught}、再捕中有標記 R=${s.R}。${n===null?'R 為零或大於可有的標記／再捕數量，這組資料不能套用估算式。':`依 M × C ÷ R 得到約 ${fmt(n)} 個體。`}方法假設標記不脫落、不影響生存與捕捉機率，放回後充分混合，兩次捕捉間出生、死亡與遷移可忽略。${s.assumption?'目前設定標記者較易被捕，R 可能偏高，總量估計因而偏低；算出數字也不代表可靠。':'即使符合假設，小樣本仍可能有很大抽樣誤差。'}此為計算示例，不是野生動物操作指引。`,`Initially M=${s.M} were marked; C=${s.caught} were caught again and R=${s.R} carried marks. ${n===null?'R is zero or exceeds a possible count, so the formula cannot be used.':`M × C ÷ R gives about ${fmt(n)} individuals.`} Marks must remain and not affect survival or capture; animals must mix, with negligible births, deaths or migration between catches. ${s.assumption?'Marked animals are easier to catch here; an inflated R can underestimate population size, so a numerical result is not necessarily reliable.':'Even when assumptions hold, small samples can have substantial sampling error.'} These are teaching values, not wildlife handling instructions.`)};
    }
  });}

  function population(o){return make(o,{kind:'population',initial:{birth:8,death:3,immigration:4,emigration:2,resource:0},
    controls:()=>[group(P('同一觀察期間的個體數','Individuals during one observation interval'),[numeric(P('出生','Births'),'birth',0,20),numeric(P('死亡','Deaths'),'death',0,20),numeric(P('遷入','Immigration'),'immigration',0,20),numeric(P('遷出','Emigration'),'emigration',0,20)]),choices(P('環境資源','Resources'),'resource',[P('較少','Lower'),P('較多','Higher')])],
    act:(s,k,v)=>setChoice(s,k,v,{birth:[0,20],death:[0,20],immigration:[0,20],emigration:[0,20],resource:[0,1]}),
    draw(c,s,t,D){frame(c,D,P('四個方向，決定一段期間的淨變化','Four flows determine the net change in one interval'));
      const q=populationBalance(40,s.birth,s.death,s.immigration,s.emigration);
      D.round(c,286,176,388,220,22,C.panel,C.green);
      for(let i=0;i<40;i++)dot(c,315+(i%10)*35,210+Math.floor(i/10)*46,7,C.green);
      box(c,D,P(`出生 +${s.birth}`,`Births +${s.birth}`),30,90,220,82,C.green);
      box(c,D,P(`遷入 +${s.immigration}`,`Arrivals +${s.immigration}`),30,380,220,82,C.blue);
      box(c,D,P(`死亡 −${s.death}`,`Deaths −${s.death}`),710,90,220,82,C.orange);
      box(c,D,P(`遷出 −${s.emigration}`,`Departures −${s.emigration}`),710,380,220,82,C.pink);
      [[s.birth,[240,174],[305,222],C.green],[s.immigration,[250,379],[305,344],C.blue],[s.death,[655,220],[715,174],C.orange],[s.emigration,[655,345],[715,379],C.pink]].forEach(([n,a,b,col])=>{if(n)flow(c,a,b,t,col,Math.min(5,n));else arrow(c,a,b,C.muted);});
      text(c,D,P(`40 + ${s.birth} + ${s.immigration} − ${s.death} − ${s.emigration} = ${q.next}`,`40 + ${s.birth} + ${s.immigration} − ${s.death} − ${s.emigration} = ${q.next}`),280,139,410,25,C.yellow);
      const k=s.resource?90:50;D.round(c,290,425,380,22,5,C.panel);D.round(c,290,425,380*k/100,22,5,C.green);
      text(c,D,P(`資源支持量示例：${k} 個體`,`Illustrative resource capacity: ${k}`),285,490,650,24,C.green);footer(c,D);
    },
    explain(s){const q=populationBalance(40,s.birth,s.death,s.immigration,s.emigration),k=s.resource?90:50;return {title:P(`淨變化 ${q.delta>=0?'+':''}${q.delta} 個體`,`Net change: ${q.delta>=0?'+':''}${q.delta} individuals`),text:P(`這是同一段觀察期間的帳：期初 40，出生 ${s.birth} 加遷入 ${s.immigration}，扣掉死亡 ${s.death} 和遷出 ${s.emigration}，期末為 ${q.next}。流動亮點用來標明方向，不是一秒一個體的出生率。資源支持量在此以 ${k} 個體作例；${q.next>k?'期末超過這個示例支持量，不代表會被瞬間刪到上限，而是提示後續可能出現資源壓力。':'此值提供資源背景，不會硬把算出的個體數截斷。'}環境負荷量會受食物、空間與其他生物影響而變動，本模型不是長期族群預測。`,`This is a balance for one observation interval: start with 40, add ${s.birth} births and ${s.immigration} arrivals, subtract ${s.death} deaths and ${s.emigration} departures, ending with ${q.next}. Moving dots show direction, not births per second. The illustrative resource capacity is ${k}. ${q.next>k?'Exceeding it suggests future resource pressure; animals are not instantly removed to enforce a ceiling.':'It provides resource context without truncating the calculated count.'} Carrying capacity changes with food, space and other organisms. This is not a long-term population forecast.`)};}
  });}

  const successionStages=[P('裸地','Bare ground'),P('草本較多','Herb stage'),P('灌木漸多','Shrub stage'),P('林木漸多','Woodland stage')];
  function succession(o){return make(o,{kind:'succession',three:true,initial:{stage:1,soil:1},
    controls:()=>[choices(P('觀察時段','Observation stage'),'stage',successionStages),choices(P('起始條件','Starting conditions'),'soil',[P('缺乏土壤','Little soil'),P('保有土壤','Soil remains')])],
    act:(s,k,v)=>setChoice(s,k,v,{stage:[0,3],soil:[0,1]}),
    draw(c,s,t,D){frame(c,D,P('物種組成隨時間改變','Community composition changes over time'));
      const faces=landscape({trees:s.stage===0?0:s.stage===1?26:s.stage===2?20:24,height:[0,17,47,105][s.stage],low:s.stage===0});
      if(!s.soil)faces.push(...prism(-330,-40,-205,660,15,410,'#86908b'));
      for(let i=0;i<6;i++)faces.push(...sphereMesh([-240+i*85,100+15*Math.sin(t*2+i),-30],7,C.yellow,3,5));
      render3(c,faces,s,t,{scale:1.13});
      successionStages.forEach((p,i)=>{D.round(c,25+i*233,470,218,66,10,i===s.stage?'#486048':C.panel,i===s.stage?C.yellow:C.muted);text(c,D,p,36+i*233,499,194,22,i===s.stage?C.yellow:C.white);});footer(c,D);
    },
    explain(s){return {title:successionStages[s.stage],text:P(`目前比較的是「${successionStages[s.stage][0]}」這個觀察時段。${s.soil?'起始地仍保留土壤，種子或根系可能仍在。':'起始地缺乏土壤，定殖與土壤形成會受到不同限制。'}群集的組成會經由生物互動與環境改變，逐漸發生替換；不是同一株草瞬間變成大樹。按鈕跳至比較時段，轉動與亮點只是觀察提示，並非實際年數。此為可能路徑，不代表所有環境一定按相同順序變成森林；氣候、干擾與種源都會改變結果。`,`You are comparing the “${successionStages[s.stage][1]}” observation stage. ${s.soil?'Soil remains, and seeds or roots may survive.':'Little soil is present, imposing different limits on establishment and soil formation.'} Species composition changes gradually through biological interactions and environmental change; a herb does not instantly turn into a tree. Buttons jump between stages, while rotation and particles are viewing aids, not elapsed years. This is one possible pathway, not a universal sequence ending in forest. Climate, disturbance and seed sources influence the outcome.`)};}
  });}

  const foodNodes=[P('植物','Plants'),P('兔','Rabbit'),P('鷹','Hawk'),P('鼠','Mouse')];
  const foodEdges=[[0,1],[1,2],[0,3],[3,2]];
  function foodweb(o){return make(o,{kind:'foodweb',initial:{mode:0,network:1,plant:1,efficiency:10},
    controls:s=>[choices(P('觀察重點','Focus'),'mode',[P('取食關係','Feeding links'),P('能量流動','Energy flow')]),s.mode?choices(P('教學傳遞比例','Teaching transfer ratio'),'efficiency',[P('5%','5%'),P('約 10%','About 10%'),P('20%','20%')],[5,10,20]):choices(P('食物來源','Food routes'),'network',[P('單一路徑','One route'),P('交錯路徑','Linked routes')]),choices(P('生產者資源','Producer resources'),'plant',[P('減少','Reduced'),P('原情境','Reference')])],
    act:(s,k,v)=>setChoice(s,k,v,{mode:[0,1],network:[0,1],plant:[0,1],efficiency:[5,20]}),
    draw(c,s,t,D){frame(c,D,s.mode?P('能量向前傳遞，最終散熱','Energy passes onward and ultimately dissipates as heat'):P('箭頭：食物 → 取食者','Arrows: food → consumer'));
      if(!s.mode){const pos=[[145,300],[440,183],[797,300],[440,394]];
        for(const [a,b] of foodEdges.slice(0,s.network?4:2)){const x=pos[a],y=pos[b],dx=y[0]-x[0],dy=y[1]-x[1],len=Math.hypot(dx,dy),ux=dx/len,uy=dy/len,trim=Math.min(78/Math.abs(ux),76/Math.abs(uy))+12;flow(c,[x[0]+ux*trim,x[1]+uy*trim],[y[0]-ux*trim,y[1]-uy*trim],t,C.yellow,s.plant?4:1);}
        pos.forEach(([x,y],i)=>{if(i===3&&!s.network)return;D.round(c,x-78,y-70,156,146,18,C.panel,C.green);figure(c,x,y-8,[0,2,3,4][i],i===0?C.green:C.orange,i===0&&!s.plant?.55:1);text(c,D,foodNodes[i],x-65,y+52,135,24);});
        text(c,D,P('生產者的資源變化會沿食物關係傳遞','Changes in producer resources affect linked consumers'),28,510,904,24,C.blue);
      }else{const b=energyBudget(s.plant?1000:500,s.efficiency/100);const labels=[P('生產者','Producers'),P('初級消費者','Primary consumers'),P('次級消費者','Secondary consumers')];
        b.levels.forEach((v,i)=>{const x=35+i*315;box(c,D,labels[i],x,115,260,94,C.green);text(c,D,P(`${fmt(v)} 能量單位`,`${fmt(v)} energy units`),x,257,270,24,C.yellow);D.round(c,x,283,260,28,5,C.panel);D.round(c,x,283,Math.max(2,v/1000*260),28,5,C.yellow);if(i<2)flow(c,[x+265,165],[x+306,165],t,C.yellow,1);flow(c,[x+110,336],[x+110,418],t,C.orange,2);});
        text(c,D,P('呼吸散熱；未被取食與排遺的能量可進入碎屑途徑','Respiration releases heat; uneaten material and waste feed detrital pathways'),32,466,896,24,C.orange);
      }footer(c,D);
    },
    explain(s){const b=energyBudget(s.plant?1000:500,s.efficiency/100);return {title:s.mode?P('單向流動，不是能量循環','One-way flow, not an energy cycle'):P('跟著食物追蹤影響','Follow food to trace consequences'),text:s.mode?P(`生產者的教學起始能量為 ${b.levels[0]} 單位，每層用 ${s.efficiency}% 傳給下一層，得到 ${fmt(b.levels[1])}、${fmt(b.levels[2])}。約十分之一只是常用概略值，實際效率因生物與環境而異。未傳至下一層的 ${fmt(b.notTransferred[0])}、${fmt(b.notTransferred[1])} 單位，包含呼吸散熱及未取食、排遺等途徑；不能全部畫成當下直接散熱。碎屑中的能量仍可供分解者利用，最終也散失為熱，需要外界持續輸入能量。`,`Producer energy starts at ${b.levels[0]} teaching units. At ${s.efficiency}% transfer, the next levels receive ${fmt(b.levels[1])} and ${fmt(b.levels[2])}. Roughly one tenth is a common approximation, not a universal constant. The ${fmt(b.notTransferred[0])} and ${fmt(b.notTransferred[1])} units not transferred include respiration heat, uneaten material and waste, rather than all becoming heat immediately. Decomposers can use energy in detritus; it ultimately dissipates as heat, so energy must continue entering from outside.`):P(`黃色箭頭由植物指向吃它的動物，再由獵物指向掠食者，表示食物中的物質與能量轉移。${s.network?'此網中鷹可經由兔或鼠獲得食物；多一條途徑不保證完全不受干擾。':'此處只追蹤植物、兔、鷹的一條路徑，不代表它們在野外只有這些食物。'}${s.plant?'目前顯示參考資源情境。':'植物資源減少時，亮點變稀，提示可傳遞資源降低，並非實測的族群減幅。'}分解者會利用各層遺體與排遺，不應只接在最高層後面；詳見碳循環。`,`Yellow arrows point from plants to the animals eating them, then from prey to predator, tracing matter and energy in food. ${s.network?'The hawk has routes through rabbit and mouse; extra routes do not guarantee immunity to disturbance.':'Only the plant–rabbit–hawk route is shown, not these animals’ complete wild diets.'} ${s.plant?'The reference resource scenario is displayed.':'Reduced plant resources produce fewer moving dots, indicating less available resource, not a measured population decline.'} Decomposers use remains and waste from all levels, not only the top; explore the carbon model.`)};}
  });}

  const carbonNames=[P('光合作用','Photosynthesis'),P('攝食','Feeding'),P('呼吸作用','Respiration'),P('分解與呼吸','Decomposition and respiration'),P('埋藏／燃燒','Burial / combustion')];
  const carbonEdges=[{from:'air',to:'plant',process:'photosynthesis'},{from:'plant',to:'animal',process:'feeding'},{from:'plant',to:'air',process:'respiration'},{from:'animal',to:'air',process:'respiration'},{from:'detritus',to:'air',process:'decomposition-respiration'},{from:'plant',to:'detritus',process:'remains'},{from:'animal',to:'detritus',process:'remains'},{from:'detritus',to:'fossil',process:'burial'},{from:'fossil',to:'air',process:'combustion'}];
  function carbon(o){return make(o,{kind:'carbon',initial:{path:0,burning:1},
    controls:s=>[choices(P('追蹤含碳物質','Trace carbon'),'path',carbonNames),...(s.path===4?[choices(P('燃燒情境','Combustion'),'burning',[P('較少','Less'),P('較多','More')])]:[])],
    act:(s,k,v)=>setChoice(s,k,v,{path:[0,4],burning:[0,1]}),
    draw(c,s,t,D){frame(c,D,P('同一種元素，走過不同物質','The same element moves through different substances'));
      const nodes={air:[480,131],plant:[155,302],animal:[480,302],detritus:[803,302],fossil:[480,476]};
      const edgePaths=[[[404,163],[185,262]],[[255,302],[378,302]],[[130,260],[370,148]],[[480,258],[480,173]],[[777,260],[588,148]],[[230,349],[720,349]],[[580,302],[704,302]],[[787,352],[565,451]],[[400,450],[307,211],[374,151]]];
      edgePaths.forEach((ps,i)=>{line(c,ps,C.muted,2);arrow(c,ps[ps.length-2],ps[ps.length-1],C.muted,2);});
      const active=[[0],[1],[2,3],[4,5,6],[7,8]][s.path];
      active.forEach(i=>{const ps=edgePaths[i];for(let j=1;j<ps.length;j++)flow(c,ps[j-1],ps[j],t,i===8?C.orange:C.yellow,i===8?(s.burning?4:1):3);});
      [[P('大氣二氧化碳','Air: carbon dioxide'),'air',C.blue],[P('生產者','Producers'),'plant',C.green],[P('消費者','Consumers'),'animal',C.orange],[P('碎屑／分解者','Detritus / decomposers'),'detritus',C.pink],[P('地層中的碳','Buried carbon'),'fossil',C.muted]].forEach(([p,id,col])=>{const [x,y]=nodes[id];box(c,D,p,x-102,y-40,204,80,col);});footer(c,D);
    },
    explain(s){const details=[
      P('光合作用把環境中的二氧化碳轉為生物體內的有機物。黃色亮點追蹤碳元素，不代表氧氣、能量或整個二氧化碳分子原封不動地走完每條路徑。','Photosynthesis incorporates carbon from environmental CO₂ into organic matter. Yellow dots track carbon atoms, not oxygen, energy or unchanged CO₂ molecules along every route.'),
      P('消費者攝食後，食物中一部分含碳物質進入身體；未消化部分會排出。碳由生產者傳至消費者，不代表碳只能沿著這一條食物鏈移動。','After feeding, consumers incorporate some carbon from food and release undigested material. Carbon passes from producer to consumer, but is not limited to this single chain.'),
      P('生產者和消費者都會呼吸，分解者也會呼吸。呼吸作用讓有機物中的碳以二氧化碳等形式回到環境；植物並非只吸收二氧化碳而不排出。','Producers, consumers and decomposers all respire. Respiration returns carbon in organic matter to the environment as CO₂; plants do not only take up CO₂.'),
      P('各營養階層的遺體與排遺皆可成為碎屑。分解者利用其中有機物，其呼吸將碳釋回環境；分解不是把物質憑空消失。此合併方框省略了多個微生物與化學步驟。','Remains and waste from all trophic levels become detritus. Decomposers use its organic matter and release carbon through respiration; matter does not vanish. This combined box omits multiple microbial and chemical steps.'),
      P(`少部分含碳物質可在適當條件下長期埋藏，部分形成化石燃料；不是所有遺體都會變成煤或石油。燃燒把地層中的碳較快送回大氣。目前為${s.burning?'較多':'較少'}燃燒情境，橘點疏密只作定性比較，與埋藏的地質時間不採相同比例。`,`Some carbon is buried over long periods under suitable conditions, and some forms fossil fuels; not all remains become coal or oil. Combustion returns buried carbon to air much faster. This ${s.burning?'higher':'lower'} combustion scenario uses orange-dot density qualitatively, not on the same timescale as geological burial.`)
    ];return {title:carbonNames[s.path],text:P(details[s.path][0]+' 碳可循環，能量則單向流動並散熱；本圖省略海洋交換等路徑，箭頭粗細不是通量。',details[s.path][1]+' Carbon cycles; energy flows and dissipates as heat. Ocean exchange and other pathways are omitted, and arrow widths are not flux measurements.')};}
  });}

  const relationData=[
    {name:P('掠食','Predation'),a:P('兔（獵物）','Rabbit (prey)'),b:P('鷹（掠食者）','Hawk (predator)'),sign:['−','+'],detail:P('取食者獲得養分，被取食者受害；食物箭頭由兔指向鷹。族群可能相互影響，但不一定出現規則週期。','The predator gains food and the prey is harmed. Food arrows point from rabbit to hawk. Their populations can affect one another without following a fixed cycle.')},
    {name:P('競爭','Competition'),a:P('植物甲','Plant A'),b:P('植物乙','Plant B'),sign:['−','−'],detail:P('雙方利用相同且有限的資源，彼此的存在會降低可用資源；負號是相對於沒有競爭者的情況，不代表兩者必然死亡。','Both use the same limited resource. Each has less available because the other is present. Minus signs compare with an absence of competitors, not inevitable death.')},
    {name:P('互利共生','Mutualism'),a:P('寄居蟹','Hermit crab'),b:P('海葵','Sea anemone'),sign:['+','+'],detail:P('課本例中海葵提供保護，寄居蟹的移動增加海葵取得食物的機會。兩者受益的機制不同，不能只以住在一起判定互利。','In the textbook example, the anemone offers protection and the crab’s movement increases feeding opportunities. Benefits differ; living together alone does not prove mutualism.')},
    {name:P('片利共生','Commensalism'),a:P('鳥巢蕨','Bird’s-nest fern'),b:P('大樹','Host tree'),sign:['+','0'],detail:P('課本情境中鳥巢蕨取得較好的生長位置，大樹未見明顯利害；附生不等於寄生，不能把樹當成鳥巢蕨直接吸取養分的來源。','The fern gains a growing position while the tree has no evident benefit or harm in this example. An epiphyte is not necessarily a parasite and does not directly draw nutrients from the tree.')},
    {name:P('寄生','Parasitism'),a:P('壁蝨','Tick'),b:P('寄主','Host'),sign:['+','−'],detail:P('壁蝨取得血液養分，寄主受害。寄生通常不使寄主立刻死亡；正負號和掠食相似，仍須看生活方式與取食歷程。','The tick gains nutrients from blood and the host is harmed. Parasites usually do not immediately kill their hosts. Signs resemble predation, but the way of living and feeding matters.')},
    {name:P('生物防治','Biological control'),a:P('蚜蟲','Aphid'),b:P('瓢蟲','Ladybird'),sign:['−','+'],detail:P('利用瓢蟲捕食蚜蟲可減少害蟲壓力；不能保證清除全部害蟲，也不是任意引進外來種。須評估專一性、非目標物種風險並持續監測。','Ladybirds feeding on aphids can reduce pest pressure. This neither guarantees eradication nor justifies introducing nonnative species freely. Specificity, nontarget risks and monitoring matter.')}
  ];
  function relations(o){return make(o,{kind:'relations',initial:{relation:0,resource:0},
    controls:s=>[choices(P('交互關係','Interaction'),'relation',relationData.map(q=>q.name)),...(s.relation===1?[choices(P('共用資源','Shared resources'),'resource',[P('有限','Limited'),P('較充足','More abundant')])]:[])],
    act:(s,k,v)=>setChoice(s,k,v,{relation:[0,5],resource:[0,1]}),
    draw(c,s,t,D){const q=relationData[s.relation];frame(c,D,q.name);
      box(c,D,q.a,45,133,300,100,C.blue);box(c,D,q.b,615,133,300,100,C.orange);
      D.text(c,q.sign[0],195,333,{size:48,color:q.sign[0]==='+'?C.green:C.yellow,align:'center'});D.text(c,q.sign[1],765,333,{size:48,color:q.sign[1]==='+'?C.green:C.yellow,align:'center'});
      if(s.relation===1){dot(c,480,382,s.resource?52:27,C.green);flow(c,[460,350],[310,252],t,C.green,s.resource?5:2);flow(c,[500,350],[650,252],t,C.green,s.resource?5:2);text(c,D,P('共同資源','Shared resource'),365,469,260,24,C.green);}
      else if(s.relation===2){flow(c,[350,270],[608,270],t,C.green);flow(c,[608,352],[350,352],t,C.blue);text(c,D,P('不同方式，雙方受益','Different benefits for both'),295,460,590,24,C.green);}
      else {const reverse=s.relation===3||s.relation===4;flow(c,reverse?[607,292]:[350,292],reverse?[350,292]:[607,292],t,C.yellow);text(c,D,s.relation===3?P('取得生長位置','Access to a growing position'):P('養分轉移方向','Direction of nutrient transfer'),300,420,590,24,C.yellow);}
      text(c,D,P('＋ 有利　− 有害　0 無明顯利害','+ Benefit   − Harm   0 No evident effect'),40,518,880,24);footer(c,D);
    },
    explain(s){const q=relationData[s.relation];return {title:q.name,text:P(`${q.a[0]}：${q.sign[0]}；${q.b[0]}：${q.sign[1]}。${q.detail[0]}${s.relation===1?`目前資源${s.resource?'較充足，示意競爭壓力可降低':'有限，示意競爭壓力較明顯'}。`:`共用資源選項${s.resource?'較充足':'有限'}僅用於競爭情境，不改變本例關係的判讀。`}圖中的符號與亮點表達交互影響，不是族群數量或成效百分比。`,`${q.a[1]}: ${q.sign[0]}; ${q.b[1]}: ${q.sign[1]}. ${q.detail[1]} ${s.relation===1?`Resources are ${s.resource?'more abundant, illustrating potentially reduced competition':'limited, illustrating greater competition'}.`:'The shared-resource setting applies to the competition example and does not redefine this relationship.'} Symbols and moving dots indicate effects, not population counts or effectiveness percentages.`)};}
  });}

  const habitatNames=[P('森林','Forest'),P('草原','Grassland'),P('沙漠','Desert'),P('凍原','Tundra'),P('淡水','Fresh water'),P('河口','Estuary'),P('海洋','Ocean'),P('校園比較','Schoolyard comparison')];
  function habitat(o){return make(o,{kind:'habitat',three:true,initial:{habitat:0,water:1,light:1,temperature:1},
    controls:()=>[choices(P('棲地','Habitat'),'habitat',habitatNames),choices(P('水分／水位情境','Water / water-level scenario'),'water',[P('低','Low'),P('高','High')]),choices(P('光照','Light'),'light',[P('遮蔭／弱光','Shaded / dim'),P('明亮','Bright')]),choices(P('溫度情境','Temperature scenario'),'temperature',[P('較冷','Cooler'),P('較暖','Warmer')])],
    act:(s,k,v)=>setChoice(s,k,v,{habitat:[0,7],water:[0,1],light:[0,1],temperature:[0,1]}),
    draw(c,s,t,D){frame(c,D,habitatNames[s.habitat]);
      let n=[27,24,3,12,14,15,0,18][s.habitat],h=[110,17,32,15,55,66,0,80][s.habitat];
      const faces=landscape({water:s.habitat>=4,trees:n,height:h,low:s.habitat===2||s.habitat===3,variety:s.habitat===7});
      if(s.water&&s.habitat>=4)faces.push(...slab3(-55,7,-205,135,5,410,'#55b6c5'));
      if(s.habitat>=4&&s.habitat<7)for(let i=0;i<7;i++)faces.push(...sphereMesh([-15+Math.sin(t+i)*25,25,-160+((i*50+t*25)%320)],9,C.orange,4,6));
      else for(let i=0;i<6;i++)faces.push(...sphereMesh([-240+i*90,105+Math.sin(t+i)*12,-60],7,C.pink,3,5));
      render3(c,faces,s,t,{scale:1.13});
      const vals=[P(`水：${s.water?'高':'低'}`,`Water: ${s.water?'high':'low'}`),P(`光：${s.light?'明亮':'較弱'}`,`Light: ${s.light?'bright':'dim'}`),P(`溫：${s.temperature?'較暖':'較冷'}`,`Temperature: ${s.temperature?'warmer':'cooler'}`)];
      vals.forEach((p,i)=>{box(c,D,p,25+i*312,452,288,76,[C.blue,C.yellow,C.orange][i]);});
      if(s.light)for(let i=0;i<5;i++)line(c,[[330+i*67,85],[350+i*67,128]],C.yellow,3);
      footer(c,D);
    },
    explain(s){const details=[
      P('森林包含多層植被，樹冠影響林下光照；不同溫度和水分條件可形成不同林相。','Forests have vegetation layers, and canopy cover changes understory light. Temperature and water availability help shape forest types.'),
      P('草原以草本植物為主，水分、放牧與火等干擾都可能影響植被；不能只以一個雨量門檻判定。','Grasslands are dominated by herbs. Water, grazing and fire can affect vegetation; one rainfall threshold is not enough to define them.'),
      P('沙漠的關鍵是乾旱，不是每一處都高溫；生物需面對少水或水分散失的壓力。','Aridity defines deserts; not every desert is hot. Organisms face limited water and water-loss stress.'),
      P('凍原常受低溫和短生長季限制，地衣、草與矮灌木等較常見；不是完全沒有生命。','Cold and short growing seasons constrain tundra, where lichens, herbs and low shrubs occur; it is not lifeless.'),
      P('淡水可包含靜水池塘與流水溪流；水深、透光、流速與溶氧會影響生物組成。','Freshwater habitats include still ponds and flowing streams. Depth, light, flow and dissolved oxygen affect their communities.'),
      P('河口位於河海交界，水位及鹽度會隨潮汐等因素改變，生物需適應變動；不是固定的中等鹽度。','Estuaries meet the sea. Tides and other factors change water level and salinity, so organisms face variation, not a fixed intermediate salinity.'),
      P('海洋上層透光區可進行光合作用，深處仍可能有生物依靠沉降碎屑或熱泉等能量來源。光照不能只由水深單一決定。','Photosynthesis occurs in sunlit upper waters; deeper organisms may depend on sinking detritus or vent energy. Depth alone does not determine available light.'),
      P('校園調查應在相近時間，以相同方法比較遮蔭處與開闊處，記錄環境因子及可辨認的生物；多次觀察才能避免偶然差異。','Compare shaded and open schoolyard sites at similar times using consistent methods. Record conditions and identifiable organisms, and repeat observations to reduce chance differences.')
    ];return {title:habitatNames[s.habitat],text:P(`${details[s.habitat][0]}目前選擇水分／水位${s.water?'高':'低'}、光照${s.light?'強':'弱'}、溫度${s.temperature?'較暖':'較冷'}。控制項是用來提出「哪些生物可能較適合？」的情境，不會瞬間把森林變成沙漠，也不輸出物種存活率。地景是可旋轉的 3D 示意，符號分布非實測。`,`${details[s.habitat][1]} Selected conditions: ${s.water?'higher':'lower'} water availability/level, ${s.light?'bright':'dim'} light and ${s.temperature?'warmer':'cooler'} temperature. Use these scenarios to ask which organisms might be better suited. They do not instantly transform a forest into a desert or calculate survival probabilities. This rotating 3D landscape is schematic, not survey data.`)};}
  });}

  const diversityNames=[P('遺傳多樣性','Genetic diversity'),P('物種多樣性','Species diversity'),P('生態系多樣性','Ecosystem diversity'),P('原始林與棕櫚園','Forest and palm plantation')];
  function diversity(o){return make(o,{kind:'diversity',three:s=>s.level>=2,initial:{level:0,variety:1},
    controls:()=>[choices(P('比較面向','Compare'),'level',diversityNames),choices(P('差異程度情境','Variation scenario'),'variety',[P('較單一','More uniform'),P('較多樣','More varied')])],
    act:(s,k,v)=>setChoice(s,k,v,{level:[0,3],variety:[0,1]}),
    draw(c,s,t,D){frame(c,D,diversityNames[s.level]);
      if(s.level>=2){const faces=landscape({trees:24,height:s.variety?95:70,variety:!!s.variety,water:!!s.variety});render3(c,faces,s,t,{scale:1.13});text(c,D,s.level===3?P('同樣綠色，不代表相同生物多樣性','The same green cover need not mean the same biodiversity'):P('不同環境提供不同生存條件','Different environments offer different living conditions'),28,491,904,24,C.blue);}
      else {for(let i=0;i<18;i++){const x=90+(i%6)*156,y=170+Math.floor(i/6)*115+Math.sin(t*1.7+i)*5,kind=s.level===0?1:s.variety?i%3:0,col=s.variety?[C.green,C.orange,C.pink][i%3]:C.green;figure(c,x,y,kind,col,1.1);}
        text(c,D,s.level===0?P('同種個體的基因差異；顏色僅作符號','Genetic differences within one species; colours are symbols'):P('不同形狀代表不同物種','Different shapes represent different species'),28,494,904,24,C.blue);}
      footer(c,D);
    },
    explain(s){const d=[P('同一物種的個體間有不同基因組合。模型用色彩區別基因差異，但外觀差異也可能受環境影響，不能只看體色就測出遺傳多樣性。','Individuals within a species carry different genetic combinations. Colours symbolise genetic differences, but appearance also depends on environment; colour alone cannot measure genetic diversity.'),P('同一地區可有不同物種。不同形狀代表種類，單純增加同一種的個體數不等於增加物種數；多樣性也不應只看總數。','Different species can share an area. Shapes represent species. More individuals of one species do not add species, and diversity is not just a total count.'),P('森林、草原、水域等不同環境及群集構成生態系的多樣性。不是把任何外來生物放進同一地點就能提升本地多樣性。','Different environments and communities, such as forests, grasslands and waters, contribute to ecosystem diversity. Introducing arbitrary nonnative organisms does not necessarily increase local biodiversity.'),P('原始林與人工棕櫚園都可能看起來很綠，但植被層次、種類、微棲地與遺傳來源可差很多。模型比較多樣地景與規整單一植被，不能從模型樹數推算原圖的生物多樣性。','A forest and a palm plantation may both look green while differing in vegetation layers, species, microhabitats and genetic sources. This model contrasts varied habitat and uniform vegetation; tree symbols cannot quantify biodiversity in the original images.')][s.level];return {title:diversityNames[s.level],text:P(`${d[0]}目前是${s.variety?'較多樣':'較單一'}的教學情境。多樣性可提供食物、材料、醫藥研究資源與文化價值，也具有生物本身的價值；模型不將這些價值換算成金額或固定韌性分數。`,`${d[1]} This is the ${s.variety?'more varied':'more uniform'} teaching scenario. Biodiversity supports food, materials, medical research and cultural values, alongside the intrinsic value of life; these are not converted into money or a fixed resilience score.`)};}
  });}

  const threatNames=[P('棲地破碎','Fragmentation'),P('過度採捕','Overharvesting'),P('外來種影響','Nonnative species effects'),P('營養鹽汙染','Nutrient pollution')];
  function threats(o){return make(o,{kind:'threats',three:true,initial:{threat:0,pressure:1,corridor:0},
    controls:s=>[choices(P('壓力類型','Type of pressure'),'threat',threatNames),choices(P('壓力情境','Pressure scenario'),'pressure',[P('較低','Lower'),P('較高','Higher')]),...(s.threat===0&&s.pressure?[choices(P('連通措施','Connection'),'corridor',[P('沒有廊道','No corridor'),P('加入廊道','Add corridor')])]:[])],
    act:(s,k,v)=>setChoice(s,k,v,{threat:[0,3],pressure:[0,1],corridor:[0,1]}),
    draw(c,s,t,D){frame(c,D,threatNames[s.threat]);
      const frag=s.threat===0&&!!s.pressure,faces=landscape({fragment:frag,corridor:!!s.corridor,water:s.threat===3,trees:s.threat===1&&s.pressure?9:24,height:85});
      for(let i=0;i<7;i++){
        let x=-270+((t*50+i*73)%540),z=45+i*9;
        if(frag){if(s.corridor)z=0;else x=i%2?-245+((t*30+i*23)%165):85+((t*30+i*23)%165);}
        faces.push(...sphereMesh([x,s.corridor&&frag?43:22,z],11,C.orange,4,7));
      }
      if(s.threat===2)for(let i=0;i<(s.pressure?20:3);i++)faces.push(...sphereMesh([-260+(i*97)%510,30,-135+(i*67)%265],13,C.pink,4,6));
      if(s.threat===3&&s.pressure)for(let i=0;i<30;i++)faces.push(...sphereMesh([-40+(i*17)%100,16,-190+(i*53)%380],8,'#9aca4c',3,5));
      render3(c,faces,s,t,{scale:1.1});text(c,D,s.threat===0?P(s.corridor?'廊道是連通工具，不能補回所有失去的棲地':'道路切割棲地，跨越可能受阻',s.corridor?'A corridor connects patches; it cannot replace all habitat':'Roads divide habitat and can obstruct movement'):P('比較機制，不把符號數當成實測數量','Compare mechanisms; symbol counts are not measurements'),28,494,904,24,C.blue);footer(c,D);
    },
    explain(s){const d=[P(`道路可能同時造成棲地面積減少、破碎化與路殺風險。${s.pressure?'目前道路將地景分成兩側；':'目前保留連續地景；'}${s.corridor?'加入的跨越廊道讓示意動物在兩側移動，但廊道寬度、植被、入口引導與物種需求都會影響成效。':'無廊道情境用來顯示移動受阻，不表示現實動物絕不冒險跨路。'}`,`Roads may reduce area, fragment habitat and create collision risks. ${s.pressure?'A road currently divides the landscape.':'The landscape is currently continuous.'} ${s.corridor?'The crossing corridor allows model animals to move between sides, but width, cover, entrance guidance and species needs affect success.':'The no-corridor model shows restricted movement, not a claim that animals never attempt road crossings.'}`),P('當採捕速度長期超過族群補充，資源可能下降。高壓力情境減少地景中的生物符號；這是定性後果，並非捕撈配額或安全採收比例。','When removal persistently exceeds replenishment, resources may decline. Higher pressure reduces organism symbols as a qualitative consequence, not a catch quota or safe harvest fraction.'),P('粉紅符號代表新到的物種。外來種不等於入侵種；要看其能否建立、擴散，及是否造成生態等危害。高壓力情境是假設已產生競爭等影響，不能把所有外來生物都判定有害。','Pink symbols represent newly arrived organisms. Nonnative does not automatically mean invasive: establishment, spread and harmful effects matter. The high-pressure scenario assumes impacts such as competition, not that every nonnative species is harmful.'),P('過量氮、磷等營養鹽可促使藻類增生，遮光與後續有機物分解耗氧可能導致水中缺氧。綠色斑塊是藻量示意；營養鹽造成的優養化，不等於難分解毒物的生物放大。','Excess nitrogen and phosphorus can stimulate algal growth. Shading and later decomposition of organic matter may deplete oxygen. Green patches symbolise algae; nutrient-driven eutrophication is distinct from biomagnification of persistent pollutants.')][s.threat];return {title:threatNames[s.threat],text:P(`${d[0]}目前為${s.pressure?'較高':'較低'}壓力。可旋轉觀察空間關係；時間與動物路徑均是教學示意，不是現地追蹤資料。`,`${d[1]} Pressure is set to ${s.pressure?'higher':'lower'}. Rotate to inspect spatial relationships. Timing and animal paths are teaching illustrations, not field tracking data.`)};}
  });}

  function magnification(o){return make(o,{kind:'magnification',initial:{persistent:1,base:1,factor:4},
    controls:()=>[choices(P('物質性質','Substance properties'),'persistent',[P('容易排除','Readily eliminated'),P('難代謝排除','Poorly eliminated')]),choices(P('起始濃度示例','Initial concentration'),'base',[P('1 單位／kg','1 unit/kg'),P('2 單位／kg','2 units/kg')],[1,2]),choices(P('難排除情境倍率','Poor-elimination scenario factor'),'factor',[P('2 倍','2×'),P('4 倍','4×')],[2,4])],
    act:(s,k,v)=>setChoice(s,k,v,{persistent:[0,1],base:[1,2],factor:[2,4]}),
    draw(c,s,t,D){frame(c,D,P('比較每公斤含量，不是整隻總量','Compare content per kilogram, not total per animal'));
      const values=concentrations(s.base,s.persistent?s.factor:.5),names=[P('生產者','Producer'),P('初級消費者','Primary consumer'),P('次級消費者','Secondary consumer'),P('三級消費者','Tertiary consumer')];
      values.forEach((v,i)=>{const x=28+i*235;box(c,D,names[i],x,93,205,94,C.blue);D.round(c,x+25,214,155,170,12,C.panel,C.white);
        const dots=Math.max(1,Math.round(v/s.base*1.6));for(let j=0;j<Math.min(100,dots);j++)dot(c,x+38+(j%10)*13,yDot(j,t),3.4,C.pink);
        text(c,D,P('等質量組織','Equal tissue mass'),x+10,425,200,22);text(c,D,P(`${fmt(v)} 單位／kg`,`${fmt(v)} units/kg`),x+4,472,215,24,C.yellow);if(i<3)flow(c,[x+207,295],[x+231,295],t,C.orange,1);
      });footer(c,D,P('教學濃度與倍率｜非原圖數據・非任何物質的固定倍率','Teaching concentrations and factors | Not source data or universal factors'));
    },
    explain(s){const vs=concentrations(s.base,s.persistent?s.factor:.5);return {title:P('生物放大要比較濃度','Biomagnification compares concentrations'),text:P(`四個框都代表等質量組織；每公斤的示例濃度依序為 ${vs.map(fmt).join('、')} 單位。${s.persistent?`目前假設物質難代謝排除，在這條假設食物鏈中逐層以 ${s.factor} 倍增加，示範生物放大；倍率是教學設定，不是自然界定律。`:'目前假設物質容易排除，示例濃度逐層降低，提醒並非所有汙染物必然放大。'}濃度是物質量除以組織質量；大型動物含的總量多，不足以單獨證明生物放大。同一個體隨時間累積稱為生物累積，與跨營養階層的濃度比較不同。點數只是濃度提示，並非分子實際位置。`,`All four boxes represent equal tissue mass, with illustrative concentrations of ${vs.map(fmt).join(', ')} units per kilogram. ${s.persistent?`A poorly eliminated substance increases ${s.factor}-fold at each level in this hypothetical chain, illustrating biomagnification. The factor is chosen for teaching, not a natural law.`:'A readily eliminated substance decreases in concentration here, reminding us that not every pollutant biomagnifies.'} Concentration is amount divided by tissue mass; a larger total amount in a large animal alone does not prove biomagnification. Accumulation within one organism over time is bioaccumulation, distinct from comparisons across trophic levels. Dots indicate concentration, not actual molecular locations.`)};}
  });}
  function yDot(j,t){return 230+Math.floor(j/10)*15+Math.sin(t*2+j)*2;}

  function climate(o){return make(o,{kind:'climate',initial:{gas:1,scenario:1,focus:0},
    controls:s=>[choices(P('觀察重點','Focus'),'focus',[P('輻射路徑','Radiation paths'),P('生態影響','Ecological effects')]),s.focus?choices(P('假設升溫','Hypothetical warming'),'scenario',[P('基準','Reference'),P('較溫暖','Warmer'),P('更溫暖','Still warmer')]):choices(P('溫室氣體情境','Greenhouse-gas scenario'),'gas',[P('較少','Lower'),P('較多','Higher')])],
    act:(s,k,v)=>setChoice(s,k,v,{gas:[0,1],scenario:[0,2],focus:[0,1]}),
    draw(c,s,t,D){frame(c,D,s.focus?P('升溫可能改變適生環境與物候','Warming can shift habitats and seasonal timing'):P('溫室氣體吸收並再放射紅外線','Greenhouse gases absorb and re-emit infrared radiation'));
      if(!s.focus){D.round(c,30,425,900,95,18,'#45684a');text(c,D,P('地表','Surface'),50,480,160,26,C.green);
        for(let i=0;i<(s.gas?14:5);i++){const x=130+i*51;dot(c,x,180+(i%2)*65,12,C.blue);}
        flow(c,[80,95],[275,425],t,C.yellow,4);flow(c,[448,420],[448,100],t,C.orange,3);
        for(let i=0;i<(s.gas?3:1);i++){const x=580+i*115;flow(c,[x,423],[x,225],t,C.orange,2);flow(c,[x+20,233],[x+55,413],t,C.pink,2);flow(c,[x,210],[x+20,90],t,C.orange,1);}
        text(c,D,P('黃：日光　橘／粉紅：紅外線','Yellow: sunlight; orange / pink: infrared'),30,78,900,22,C.yellow);
      }else{D.round(c,65,156,830,290,18,C.panel,C.blue);
        for(let i=0;i<12;i++){const x=100+i*64,y=395-s.scenario*62+Math.sin(i*.7)*24;figure(c,x,y+Math.sin(t+i)*5,0,i<s.scenario*2?C.muted:C.green,.8);}
        line(c,[[92,412],[864,180]],C.muted,3);text(c,D,P('較低海拔','Lower elevation'),83,490,320,24);text(c,D,P('較高海拔','Higher elevation'),631,135,280,24);arrow(c,[446,337],[572,220],C.orange);
        text(c,D,P('適生帶移動情境；不代表所有物種都能跟上','A shifting suitable zone; not all species can track it'),75,90,830,24,C.orange);
      }footer(c,D,P('假設情境｜非觀測曲線・非未來溫度預測・非定量輻射模型','Hypothetical scenario | No observed trend, temperature forecast or quantitative radiation model'));
    },
    explain(s){return {title:P('把機制、情境與預測分開','Distinguish mechanism, scenario and forecast'),text:P(`目前溫室氣體設為${s.gas?'較多':'較少'}，升溫比較為${['基準','較溫暖','更溫暖'][s.scenario]}情境。溫室氣體會吸收地表放出的部分紅外線並向各方向再放射；不是形成固體玻璃罩，也不是把所有能量永久困住。${s.focus?'適生環境可能向高海拔或高緯度移動，物種能否遷移還受地形、廊道與生活史限制；開花或繁殖時間變動也可能使互動不同步。':'較多的紅外線交互作用表示在相同地表溫度下向外散熱受影響；地球仍向太空放射能量。'}兩組控制各自比較概念，不以氣體按鈕直接算出溫度。動畫沒有真實年份、排放路徑或攝氏預測值。`,`Greenhouse gases are set to ${s.gas?'higher':'lower'}, with a ${['reference','warmer','still warmer'][s.scenario]} warming scenario. Greenhouse gases absorb some surface infrared radiation and emit in all directions; they are not a solid glass roof and do not trap all energy forever. ${s.focus?'Suitable conditions may shift uphill or poleward, but terrain, corridors and life histories constrain movement; changes in flowering or breeding may also disrupt timing between interacting species.':'More infrared interactions illustrate changes in outgoing heat at the same surface temperature; Earth still radiates to space.'} The two controls compare separate concepts rather than calculating temperature directly from a gas setting. No real years, emissions pathway or Celsius forecast is implied.`)};}
  });}

  const conservationNames=[P('保護棲地','Protect habitat'),P('連通棲地','Connect habitat'),P('減少干擾','Reduce disturbance'),P('永續利用','Use sustainably')];
  function conservation(o){return make(o,{kind:'conservation',three:true,initial:{measure:1,enabled:1,monitor:1},
    controls:()=>[choices(P('保育措施','Conservation measure'),'measure',conservationNames),choices(P('情境比較','Compare scenarios'),'enabled',[P('未採取','Without measure'),P('採取措施','With measure')]),choices(P('後續追蹤','Follow-up'),'monitor',[P('未追蹤','No monitoring'),P('持續監測','Keep monitoring')])],
    act:(s,k,v)=>setChoice(s,k,v,{measure:[0,3],enabled:[0,1],monitor:[0,1]}),
    draw(c,s,t,D){frame(c,D,conservationNames[s.measure]);
      const faces=landscape({fragment:true,corridor:s.measure===1&&!!s.enabled,trees:s.measure===0&&!s.enabled?8:25,height:90,variety:true});
      for(let i=0;i<8;i++){
        let x=-270+((t*45+i*65)%540),z=0;
        if(s.measure!==1||!s.enabled)x=i%2?-270+((t*33+i*47)%190):90+((t*33+i*47)%190);
        faces.push(...sphereMesh([x,s.measure===1&&s.enabled?42:20,z+Math.sin(i)*70*(s.measure===1&&s.enabled?0:1)],12,C.orange,4,7));
      }
      if(s.measure===2)for(let i=0;i<(s.enabled?1:5);i++)faces.push(...prism(-28,8,-170+((t*55+i*71)%325),26,15,35,'#c88271'));
      if(s.measure===3)for(let i=0;i<(s.enabled?2:9);i++)faces.push(...prism(100+(i%3)*55,3,-150+Math.floor(i/3)*70,22,17,22,'#b8a476'));
      render3(c,faces,s,t,{scale:1.13});text(c,D,s.monitor?P('監測 → 比較 → 調整措施','Monitor → compare → adapt the measure'):P('尚缺監測資料，不能只看設施判定成功','Without monitoring, a structure alone does not prove success'),28,491,904,24,C.blue);footer(c,D);
    },
    explain(s){const d=[P('保留足夠且品質良好的棲地，讓覓食、繁殖及躲避天敵等需求有機會被滿足。只圈出邊界而不處理棲地內壓力，未必有效。','Retain enough good-quality habitat to support feeding, breeding and shelter. Drawing a boundary without addressing pressures inside may not be effective.'),P('廊道或合適的跨越設施可改善破碎棲地間的連通，必須接到適合的棲地並符合目標物種需要；不是所有物種都會使用同一種設計。','Corridors or crossings can improve connectivity between fragments. They must lead to suitable habitat and fit target species; one design will not serve every species.'),P('減少車輛、燈光或人為干擾，可降低某些威脅；需找出真正影響生物的因子，與當地使用者合作調整。','Reducing traffic, lighting or human disturbance can lower some threats. Identify the actual drivers and work with local users to adjust practices.'),P('永續利用需兼顧資源補充、非目標物種與當地生計，並透過監測調整。圖中採取量只表示比較，不提供法定配額或保證安全比例。','Sustainable use considers replenishment, nontarget species and local livelihoods, with monitoring to guide adjustment. Harvest symbols compare scenarios, not legal quotas or guaranteed safe fractions.')][s.measure];return {title:conservationNames[s.measure],text:P(`${d[0]}目前${s.enabled?'採取':'未採取'}此措施，${s.monitor?'加入持續監測，應比較使用率、存活、繁殖或棲地品質等相關證據。':'未加入監測，無法從畫面判定真實成效。'}保育同時需要研究、社區參與與跨地區合作；日常可不棄養、減少一次用品並支持合適的永續行動。此模型不是現行法規摘要，也不是工程設計或成效預測。`,`${d[1]} The measure is ${s.enabled?'applied':'not applied'}. ${s.monitor?'Monitoring is included: evaluate relevant evidence such as use, survival, breeding or habitat quality.':'Without monitoring, the image cannot establish real effectiveness.'} Conservation also needs research, community participation and cooperation across regions. Everyday actions include responsible pet care, reducing disposable products and supporting suitable sustainable practices. This is not a summary of current law, an engineering design or an effectiveness forecast.`)};}
  });}

  window.EcosphereModels={biosphere,sampling,population,succession,foodweb,carbon,relations,habitat,diversity,threats,magnification,climate,conservation,
    helpers:Object.freeze({quadratEstimate,markRecapture,populationBalance,energyBudget,concentrations,rotate3,project3,sortedFaces,prism,sphereMesh,sampleIndices,foodEdges,carbonEdges})};
})();
