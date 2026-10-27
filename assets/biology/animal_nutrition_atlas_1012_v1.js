(function(root){'use strict';
 const D=root.AnimalDraw,A=root.AnimalData,original={draw:D.anatomy,labels:D.anatomyLabels,transform:D.anatomyTransform};
 // Coordinates are calibrated to this ORIGINAL AI plate, never to the old SVG.
 const placement={x:280,y:25,w:400,h:600},pixels={mouth:[410,252],pharynx:[503,335],esophagus:[533,520],stomach:[655,790],small:[555,1085],large:[719,1125],anus:[517,1438],salivary:[519,234],liver:[400,747],gall:[379,819],pancreas:[549,892]};
 // 2026-10-27: markers re-measured on the ORIGINAL plate so each ring sits on the lumen centre line (not on a wall/edge). Plate, placement and organ labels are unchanged.
 const usesAtlas=s=>s.anatomyView==='atlas'&&!s.zoomOrgan;
 D.anatomyTransform=s=>usesAtlas(s)?placement:original.transform(s);
 D.anatomyLabels=s=>usesAtlas(s)?original.labels(s).map(b=>({...b,x:b.left?16:699,w:245})):original.labels(s);
 D.organPoint=(s,o)=>{const p=D.anatomyTransform(s),point=usesAtlas(s)?{x:pixels[o.id][0]/1024,y:pixels[o.id][1]/1536}:o;return{x:p.x+point.x*p.w,y:p.y+point.y*p.h};};
 D.anatomy=function(c,s,tr,images){if(!usesAtlas(s)||!images.atlas)return original.draw(c,s,tr,images);
  D.bg(c);c.drawImage(images.atlas,placement.x,placement.y,placement.w,placement.h);
  for(const b of D.anatomyLabels(s)){const o=A.organs.find(o=>o.id===b.id),p=D.organPoint(s,o),color=o.type==='tract'?D.C.teal:D.C.orange;
   c.strokeStyle=color;c.lineWidth=2;c.beginPath();c.moveTo(b.left?b.x+b.w:b.x,b.y+b.h/2);c.lineTo(p.x,p.y);c.stroke();
   D.round(c,b.x,b.y,b.w,b.h,12,b.id===s.organ?color:D.C.deep,color);D.text(c,tr(...o.name),b.x+b.w/2,b.y+b.h/2,24,b.id===s.organ?D.C.deep:color,'center',b.w-16);
   c.beginPath();c.arc(p.x,p.y,b.id===s.organ?8:5,0,Math.PI*2);c.fillStyle=color;c.fill();
  }
  D.text(c,tr('AI 立體解剖示意 · 非實拍','AI anatomical illustration · not a photograph'),480,642,20,D.C.muted,'center',910);
 };
 root.AnimalAtlas={placement,pixels,original};
})(typeof window==='undefined'?globalThis:window);
