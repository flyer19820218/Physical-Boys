/* Teacher-requested organ recognition. The original AI plate and mature drawings are unchanged. */
(function(root){'use strict';
 const A=root.AnimalData,D=root.AnimalDraw,F=root.AnimalStoryData,Atlas=root.AnimalAtlas;
 const groups={tract:F.route.map(r=>r[0]),glands:['salivary','liver','gall','pancreas']};
 const zoomSeconds=1.2,tourSeconds=6;
 const crops={...F.crops,liver:[230,635,400,260],gall:[285,735,265,210]};
 const pixels={...Atlas.pixels,rectum:[530,1340]};
 function record(id){
  if(id==='rectum')return {id,name:['直腸','Rectum'],copy:[['先暫存糞便','Store feces'],['糞便先在直腸暫存，最後經肛門排出。','Feces are stored in the rectum, then leave through the anus.']]};
  const o=A.organs.find(o=>o.id===id);return {...o,copy:D.organCopy[id]};
 }
 function layout(id,elapsed){
  const q=root.EnzymesModel.smooth(A.clamp(elapsed/zoomSeconds,0,1)),crop=[0,0,1024,1536].map((v,i)=>v+(crops[id][i]-v)*q);
  const scale=Math.min(680/crop[2],480/crop[3]),w=crop[2]*scale,h=crop[3]*scale;
  const dest={x:600-w/2,y:335-h/2,w,h},p=pixels[id];
  return {q,crop,dest,point:{x:dest.x+(p[0]-crop[0])*scale,y:dest.y+(p[1]-crop[1])*scale}};
 }
 function marker(c,x,y,r,color){c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.lineWidth=3;c.strokeStyle=color;c.stroke();}
 function draw(c,images,tr,id,elapsed){
  D.bg(c);const o=record(id),im=images.atlas,color=groups.tract.includes(id)?D.C.teal:D.C.orange;
  D.text(c,tr(...o.name),480,38,32,D.C.yellow,'center',910);
  D.text(c,tr('原來的位置','Body location'),115,112,22,color,'center',205);
  if(im){
   c.drawImage(im,40,145,150,225);const p=pixels[id];marker(c,40+p[0]/1024*150,145+p[1]/1536*225,7,color);
   const l=layout(id,elapsed);c.drawImage(im,...l.crop,l.dest.x,l.dest.y,l.dest.w,l.dest.h);marker(c,l.point.x,l.point.y,13,color);
   c.beginPath();c.moveTo(l.point.x,l.point.y-44);c.lineTo(l.point.x,l.point.y-18);c.moveTo(l.point.x-6,l.point.y-25);c.lineTo(l.point.x,l.point.y-18);c.lineTo(l.point.x+6,l.point.y-25);c.lineWidth=3;c.strokeStyle=color;c.stroke();
  }
  D.text(c,tr('同一張 AI 解剖圖放大 · 非實拍、各器官不同比例','Same AI illustration enlarged · not photographs or a shared organ scale'),480,622,22,D.C.muted,'center',910);
 }
 function hit(point,group,organ){
  const s={anatomyMode:group==='tract'?'tract':'glands',anatomyView:'atlas',zoomOrgan:false,organ},ids=groups[group];
  const labels=D.anatomyLabels(s).concat(group==='tract'?[{id:'rectum',x:699,y:582,w:245,h:48}]:[]);
  const label=labels.find(b=>point.x>=b.x&&point.x<=b.x+b.w&&point.y>=b.y&&point.y<=b.y+b.h);if(label)return label.id;
  const p=Atlas.placement;return ids.map(id=>({id,distance:Math.hypot(point.x-(p.x+pixels[id][0]/1024*p.w),point.y-(p.y+pixels[id][1]/1536*p.h))})).filter(v=>v.distance<=22).sort((a,b)=>a.distance-b.distance)[0]?.id||null;
 }
 root.AnimalOverview={groups,zoomSeconds,tourSeconds,crops,pixels,record,layout,draw,hit};
})(typeof window==='undefined'?globalThis:window);
