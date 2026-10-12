/* Teacher-authorized replacement: starch is a LARGE connected polymer, not pairs.
 * Existing enzyme outer outline and approach/bind/split/release phases are reused.
 * The teacher requested matching active sites for starch, protein and lipid.
 * This graph depicts units, not literal chemical geometry. */
(function(root){'use strict';
 const D=root.AnimalDraw,G=root.EnzymesGeometry,M=root.EnzymesModel;
 const main=Array.from({length:22},(_,i)=>({id:i,x:110+i*35,y:238+132*Math.exp(-Math.pow((i-10.5)/1.6,2))}));
 const nodes=[...main];
 for(const parent of [4,16])for(let j=0;j<3;j++)nodes.push({id:nodes.length,x:main[parent].x+(j+1)*19,y:main[parent].y-(j+1)*24,parent:j?nodes.length-1:parent});
 const edges=[...main.slice(1).map((n,i)=>[i,n.id]),...nodes.slice(22).map(n=>[n.parent,n.id])];
 const cuts=new Set(['10:11','17:18','19:20']);
 const clamp=v=>M.clamp(v,0,1),ease=(p,a,b)=>M.smooth((p-a)/(b-a));
 function component(id){if(id<22)return id<=10?0:id<=17?1:id<=19?2:3;return id<25?0:1;}
 function product(n,complete){
  if(complete){const i=n.id;return {x:105+(i%10)*82,y:154+Math.floor(i/10)*115};}
  if(n.id<11)return {x:95+n.id*30,y:190+Math.sin(n.id*.6)*27};
  if(n.id<18)return {x:105+(n.id-11)*37,y:300+Math.sin(n.id*.6)*18};
  if(n.id<20)return {x:698+(n.id-18)*44,y:198};
  if(n.id<22)return {x:698+(n.id-20)*44,y:300};
  const j=(n.id-22)%3;return n.id<25?{x:210+j*22,y:142-j*32}:{x:273+j*19,y:347+j*33};
 }
 function graph(phase,complete=false,kind='starch'){
  const p=clamp(phase),spread=ease(p,.80,1),cleaved=p>=.59,active=kind==='protein'?main:nodes;
  const positions=active.map(n=>{const target=product(n,complete),bound={x:n.x,y:n.y};return {id:n.id,x:bound.x+(target.x-bound.x)*spread,y:bound.y+(target.y-bound.y)*spread,part:component(n.id)};});
  const bonds=edges.filter(([a,b])=>b<active.length&&(!cleaved||(p<.80?a!==10:!complete&&!cuts.has(a+':'+b))));
  return {phase:p,positions,bonds,cleaved,complete,kind,unitCount:active.length,stage:G.stage(p)};
 }
 const shapeCache={};
 function glyphPolygon(kind,index,x,y){
  const r=(kind==='starch'?17:16)*1.20,rotation=kind==='protein'&&index%3===1?.2:kind==='protein'&&index%3===2?-.2:0,points=[];
  if(kind==='starch')for(let i=0;i<6;i++){const a=i*Math.PI/3-Math.PI/6;points.push([Math.cos(a)*r,Math.sin(a)*r]);}
  else if(index%3!==1)for(let i=0;i<64;i++){const a=i*Math.PI*2/64;points.push([Math.cos(a)*r,Math.sin(a)*r]);}
  else{const corner=6;for(const [cx,cy,a] of [[r-corner,r-corner,0],[-r+corner,r-corner,Math.PI/2],[-r+corner,-r+corner,Math.PI],[r-corner,-r+corner,Math.PI*1.5]])for(let i=0;i<=8;i++){const angle=a+i*Math.PI/16;points.push([cx+Math.cos(angle)*corner,cy+Math.sin(angle)*corner]);}}
  return points.map(([px,py])=>[x+px*Math.cos(rotation)-py*Math.sin(rotation),y+px*Math.sin(rotation)+py*Math.cos(rotation)]);
 }
 function legPolygon(side){
  const points=[[-10,-3]],curves=[[-10,-3,-16,20,side*12-17,31,side*12-11,51],[side*12-11,51,side*12-8,68,side*12+15,64,side*12+12,48],[side*12+12,48,side*12+8,31,16,20,10,-3]];
  for(const [x0,y0,x1,y1,x2,y2,x3,y3] of curves)for(let i=1;i<=32;i++){const t=i/32,u=1-t;points.push([u*u*u*x0+3*u*u*t*x1+3*u*t*t*x2+t*t*t*x3,u*u*u*y0+3*u*u*t*y1+3*u*t*t*y2+t*t*t*y3]);}
  return points.map(([x,y])=>[480+(side*30+x*1.10)*1.4,288+(30+(y-30)*1.10)*1.4]);
 }
 function pocketProfile(kind){if(shapeCache[kind])return shapeCache[kind];
  const polygons=kind==='fat'?[-1,0,1].map(legPolygon):[10,11].map(i=>glyphPolygon(kind,i,main[i].x,main[i].y));
  const left=Math.min(...polygons.flat().map(p=>p[0])),right=Math.max(...polygons.flat().map(p=>p[0])),profile=[];
  for(let x=left;x<=right+.01;x+=.75){const intersections=[];
   for(const polygon of polygons)for(let i=0;i<polygon.length;i++){const a=polygon[i],b=polygon[(i+1)%polygon.length];if(x>=Math.min(a[0],b[0])&&x<=Math.max(a[0],b[0])&&Math.abs(a[0]-b[0])>1e-8)intersections.push(a[1]+(b[1]-a[1])*(x-a[0])/(b[0]-a[0]));}
   profile.push([x-480,(intersections.length?Math.max(...intersections):kind==='fat'?314:main[10].y+9)-360]);
  }return shapeCache[kind]=profile;
 }
 function contour(c,kind){const profile=pocketProfile(kind);c.moveTo(-96,-70);c.lineTo(profile[0][0],profile[0][1]);for(const [x,y] of profile)c.lineTo(x,y);c.lineTo(96,-70);}
 function enzymePath(c,kind){c.beginPath();c.moveTo(-196,-16);c.bezierCurveTo(-188,-55,-153,-63,-116,-65);c.lineTo(-96,-70);const profile=pocketProfile(kind);c.lineTo(profile[0][0],profile[0][1]);for(const [x,y] of profile)c.lineTo(x,y);c.lineTo(96,-70);c.lineTo(118,-65);c.bezierCurveTo(174,-64,207,-39,211,18);c.bezierCurveTo(227,105,120,141,29,128);c.bezierCurveTo(-70,148,-195,107,-208,47);c.quadraticCurveTo(-218,11,-196,-16);c.closePath();}
 function enzyme(c,p,kind,tr){
  const release=ease(p,.80,1),retreat=ease(p,.66,.80)*(1-release),scale=1-.30*release;c.save();c.translate(480,360+80*(1-ease(p,.05,.30))+120*retreat+55*release);c.scale(scale,scale);
  enzymePath(c,kind);const paint=c.createLinearGradient(-185,-70,130,130);paint.addColorStop(0,'#d2fff6');paint.addColorStop(.3,kind==='starch'?'#55e9ff':kind==='protein'?'#f472b6':'#fb923c');paint.addColorStop(1,'#27635b');
  c.fillStyle=paint;c.fill();c.strokeStyle='#bceee5';c.lineWidth=4;c.stroke();c.beginPath();contour(c,kind);c.strokeStyle='#fde047';c.lineWidth=5;c.stroke();c.restore();
  if(p>=.30&&p<.66){c.strokeStyle='#fde047';c.lineWidth=2;c.beginPath();c.moveTo(480,378);c.lineTo(709,463);c.stroke();D.text(c,tr('吻合的活性區','Matching active site'),797,478,22,D.C.yellow,'center',230);}
  if(p>=.98)D.text(c,tr('酵素保留，可再次作用','Enzyme remains and can act again'),480,542,24,D.C.teal,'center',870);
 }
 function draw(c,phase,tr,options={}){
  const kind=options.kind||'starch',complete=!!options.complete,g=graph(phase,complete,kind);D.bg(c);
  const title=g.phase>=.98?complete?(kind==='starch'?['小腸完成消化：葡萄糖','Intestinal digestion completed: glucose']:['小腸完成消化：胺基酸','Intestinal digestion completed: amino acids']):(kind==='starch'?['澱粉初步分解：較短鏈與麥芽糖','Initial starch digestion: short chains and maltose']:['蛋白質初步分解：較短鏈','Initial protein digestion: shorter chains']):(kind==='starch'?['澱粉：許多葡萄糖單元相連','Starch: many linked glucose units']:['蛋白質：許多胺基酸單元相連','Protein: many linked amino-acid units']);
  D.text(c,tr(...title),480,40,28,kind==='starch'?D.C.yellow:D.C.pink,'center',900);
  const key=kind==='starch'?tr('一個六角形＝一個葡萄糖單元','One hexagon = one glucose unit'):tr('一個彩色單元＝一個胺基酸','One colored unit = one amino acid');
  D.text(c,key,480,86,22,D.C.white,'center',900);
  if(g.phase<.98||!complete)enzyme(c,g.phase,kind,tr);
  c.lineCap='round';
  for(const [a,b] of g.bonds){const n=g.positions[a],m=g.positions[b];c.beginPath();c.moveTo(n.x,n.y);c.lineTo(m.x,m.y);c.strokeStyle=kind==='starch'?'#efcb63':'#d98bb8';c.lineWidth=5;c.stroke();}
  if(g.phase>=.30&&g.phase<.59){const a=g.positions[10],b=g.positions[11];c.beginPath();c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);c.strokeStyle='#f2ecd9';c.lineWidth=8;c.stroke();}
  for(const n of g.positions){if(kind==='starch')D.sugar(c,n.x,n.y,17);else D.amino(c,n.x,n.y,n.id,16);}
  const stage=g.stage,names=[['長鏈靠近酵素','Long chain approaches'],['只有局部連結進入活性區','A local link fits the active site'],['切開連結，不是消滅單元','Break links, not units'],[complete?kind==='starch'?'小腸酵素完成消化 → 葡萄糖':'小腸酵素完成消化 → 胺基酸':kind==='starch'?'多次作用 → 較短鏈與麥芽糖':'多次作用 → 較短的蛋白質鏈',complete?kind==='starch'?'Intestinal enzymes finish → glucose':'Intestinal enzymes finish → amino acids':kind==='starch'?'Repeated action → short chains and maltose':'Repeated action → shorter protein chains']];
  if(g.phase>=.98&&!complete){D.text(c,tr('較短鏈','Short chains'),218,455,24,D.C.green,'center',290);D.text(c,tr(kind==='starch'?'麥芽糖（雙醣）':'較短鏈',kind==='starch'?'Maltose (disaccharide)':'Short chains'),722,385,24,D.C.green,'center',360);}
  D.text(c,tr(...names[stage]),480,588,25,stage===3?D.C.green:D.C.yellow,'center',900);
  D.text(c,tr('單元數不變；鏈為縮略示意，非真實分子形狀、數量或速率','Units are conserved; abbreviated chains—not molecular shape, count or speed'),480,636,22,D.C.muted,'center',915);
  return g;
 }
 function lipid(c,p,tr){p=clamp(p);D.bg(c);D.text(c,tr('脂肪酶：與三腳脂質吻合','Lipase: a matching site for three-legged fat'),480,40,28,D.C.orange,'center',900);
  D.text(c,tr('主體＝甘油；三隻腳＝脂肪酸','Body = glycerol; three legs = fatty acids'),480,86,22,D.C.white,'center',900);enzyme(c,p,'fat',tr);
  const approachX=ease(p,0,.15),approachY=ease(p,.15,.30),lift=ease(p,.66,.80),out=ease(p,.80,1),split=out;
  const x=195+285*approachX+240*out,y=235+53*approachY-110*lift;c.save();c.translate(x,y);c.scale(1.4,1.4);D.lipid(c,0,0,split);c.restore();
  if(p>=.5&&p<.66){c.strokeStyle=D.C.yellow;c.lineWidth=3;for(const side of [-1,0,1]){c.beginPath();c.moveTo(x+side*42-7,y);c.lineTo(x+side*42+7,y);c.stroke();}}
  const names=[['靠近','Approach'],['形狀吻合、結合','Matching shape and binding'],['切開脂質的連結','Break the fat’s links'],['釋放甘油與脂肪酸；酵素保留','Release glycerol and fatty acids; enzyme remains']];
  if(p>=.98){D.text(c,tr('甘油','Glycerol'),630,315,24,D.C.green,'center',150);D.text(c,tr('三條脂肪酸','Three fatty acids'),810,315,24,D.C.green,'center',270);}
  D.text(c,tr(...names[G.stage(p)]),480,588,25,D.C.green,'center',900);D.text(c,tr('國中簡化模型；真實消化產物也包括單酸甘油酯','Simplified model; real products also include monoglycerides'),480,636,22,D.C.muted,'center',915);
 }
 root.AnimalPolymer={nodes,edges,cuts,component,graph,draw,lipid,pocketProfile,glyphPolygon,enzymePath};
})(typeof window==='undefined'?globalThis:window);
