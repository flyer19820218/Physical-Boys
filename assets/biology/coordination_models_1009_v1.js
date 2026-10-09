/* Shared drawing vocabulary for new lessons only. Timing and distances are teaching models. */
(()=>{'use strict';
const B=window.LivingBook,D=B.D,C={white:'#f2ecd9',yellow:'#fde047',cyan:'#55e9ff',green:'#4ade80',orange:'#fb923c',pink:'#f472b6',panel:'#1c3d34',paper:'#faf7eb'};
const pair=(zh,en)=>[zh,en];
function photo(c,file,x=20,y=60,w=410,h=490){D.round(c,x,y,w,h,15,C.paper);return D.image(c,file,x+12,y+12,w-24,h-24);}
function label(c,p,x,y,w=400,color=C.white,size=24){return D.wrap(c,p,x,y,w,{color,size,line:size*1.42});}
function node(c,p,x,y,w=180,active=false,color=C.cyan){D.round(c,x,y,w,86,16,active?color:C.panel,active?C.white:'#47675d');label(c,p,x+14,y+32,w-28,active?'#11261f':C.white,24);}
function pulse(c,points,t,color=C.cyan,count=1){D.line(c,points,color+'55',8);D.flow(c,points,t,count,(cc,x,y)=>{D.sphere(cc,x,y,11,color);});}
function chain(c,names,t,{x=455,y=95,w=470,step=-1,vertical=true,color=C.cyan}={}){
 const index=step>=0?step:Math.floor(t*.7)%names.length;
 names.forEach((p,i)=>{const xx=vertical?x:x+i*(w/names.length),yy=vertical?y+i*100:y,ww=vertical?w:w/names.length-14;
  if(i){const a=vertical?[xx+ww/2,yy-14]:[xx-14,yy+43],b=vertical?[xx+ww/2,yy]:[xx,yy+43];pulse(c,[a,b],t,color,1);}node(c,p,xx,yy,ww,i===index,color);
 });return index;
}
const choice=(label,key,items)=>({label,items:items.map(([value,text])=>({key,value,label:text}))});
const stepControls=names=>choice(pair('訊息位置','Signal position'),'step',[[-1,pair('連續觀察','Continuous')],...names.map((p,i)=>[i,p])]);
const source=(name,page,figure)=>({name:Array.isArray(name)?name:pair(name,'Original textbook figure'),page,figure});
function polygon(c,x,y,r,n,color){c.beginPath();for(let i=0;i<n;i++){const a=i*Math.PI*2/n-Math.PI/2;c[i?'lineTo':'moveTo'](x+Math.cos(a)*r,y+Math.sin(a)*r);}c.closePath();c.fillStyle=color;c.fill();c.strokeStyle=C.white;c.lineWidth=2;c.stroke();}
function leaf(c,x,y,s=1,angle=0){c.save();c.translate(x,y);c.rotate(angle);c.scale(s,s);const g=c.createLinearGradient(-30,-50,35,25);g.addColorStop(0,'#b3e488');g.addColorStop(1,'#348253');c.beginPath();c.moveTo(0,0);c.bezierCurveTo(-70,-10,-70,-80,0,-100);c.bezierCurveTo(60,-68,50,-12,0,0);c.fillStyle=g;c.fill();D.line(c,[[0,0],[0,-82]],'#e2edb0',3);c.restore();}
function seedling(c,x,y,progress,dir=0,{roots=true}={}){const h=75+progress*190,dx=dir*progress*120;
 D.line(c,[[x,y],[x,y-h*.4],[x+dx*.3,y-h*.75],[x+dx,y-h]],'#82b06a',10);
 leaf(c,x+dx,y-h,.65,-.6);leaf(c,x+dx,y-h,.65,.8);
 if(roots)for(let i=-2;i<=2;i++)D.line(c,[[x,y],[x+i*13,y+22],[x+i*23+dir*12,y+58]],'#e9d8a1',3);
}
window.CoordinationModels={B,D,C,pair,photo,label,node,pulse,chain,choice,stepControls,source,polygon,leaf,seedling};
})();
