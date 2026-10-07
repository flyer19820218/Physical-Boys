/* One contour is the source of truth for both the pocket and the substrate.
 * Generic shape-fit model: neither molecular structures nor measured sizes. */
(function(root){'use strict';
 const M=root.EnzymesModel||(typeof require!=='undefined'?require('./enzymes_model_v2.js'):null);
 const profiles={
  starch:[['C',-100,-10,-83,14,-55,17],['L',-37,17],['L',-37,43],['C',-26,55,26,55,37,43],['L',37,17],['L',55,17],['C',83,14,100,-10,96,-70]],
  protein:[['C',-90,-26,-69,-27,-57,-8],['L',-18,43],['Q',0,61,18,43],['L',57,-8],['C',69,-27,90,-26,96,-70]],
  fat:[['C',-95,-40,-67,-32,-67,-8],['C',-67,25,-38,25,-35,45],['Q',0,68,35,45],['C',38,25,67,25,67,-8],['C',67,-32,95,-40,96,-70]]
 };
 const origin={x:480,y:360},stagePoints=[0,.42,.59,1];
 function contour(c,id,move=true){if(move)c.moveTo(-96,-70);for(const [op,...a] of profiles[id]){if(op==='C')c.bezierCurveTo(...a);else if(op==='Q')c.quadraticCurveTo(...a);else c.lineTo(...a);}}
 function substratePath(c,id){c.beginPath();contour(c,id);c.lineTo(96,-93);c.quadraticCurveTo(0,-112,-96,-93);c.closePath();}
 function enzymePath(c,id){c.beginPath();c.moveTo(-196,-16);c.bezierCurveTo(-188,-55,-153,-63,-116,-65);c.lineTo(-96,-70);contour(c,id,false);c.lineTo(118,-65);c.bezierCurveTo(174,-64,207,-39,211,18);c.bezierCurveTo(227,105,120,141,29,128);c.bezierCurveTo(-70,148,-195,107,-208,47);c.quadraticCurveTo(-218,11,-196,-16);c.closePath();}
 const ease=(p,a,b)=>M.smooth((p-a)/(b-a)),lerp=(a,b,q)=>a+(b-a)*q;
 function stage(p,match=true){if(!match)return p<.30?0:p<.64?1:3;return p<.30?0:p<.50?1:p<.66?2:3;}
 function scene(u){
  const generic=u.tab===0,join=generic&&u.mode==='join',p=M.clamp(u.phase,0,1),pair=M.pairs.find(v=>v.id===u.enzyme),id=generic?'starch':u.substrate,pocket=generic?'starch':pair.target,match=generic||id===pocket;
  const data={id,pocket,match,join,phase:p,stage:stage(p,match),origin,color:generic?'#55e9ff':pair.color,pieces:[],bond:0,failed:!match&&p>=.30};
  if(u.dragPoint&&!generic){data.pieces=[{part:'whole',x:u.dragPoint.x,y:u.dragPoint.y}];data.bond=1;data.stage=0;return data;}
  if(!match){const q=p<.55?ease(p,0,.30):1-ease(p,.64,1);data.pieces=[{part:'whole',x:lerp(195,480,q),y:235}];data.bond=1;return data;}
  if(p<.66){
   if(join){data.pieces=[{part:'left',x:lerp(195,480,ease(p,0,.16)),y:lerp(235,360,ease(p,.16,.30))},{part:'right',x:lerp(785,480,ease(p,.12,.26)),y:lerp(235,360,ease(p,.26,.40))}];data.bond=ease(p,.50,.64);}
   else{data.pieces=[{part:'whole',x:lerp(195,480,ease(p,0,.15)),y:lerp(235,360,ease(p,.15,.30))}];data.bond=1-ease(p,.50,.64);}
  }else{
   // Lift clear of the pocket before moving sideways: no passing through the enzyme.
   const lift=ease(p,.66,.80),out=ease(p,.80,.97),y=lerp(360,228,lift),x=lerp(480,782,out);
   if(join){data.pieces=[{part:'whole',x,y}];data.bond=1;}
   else{const separate=ease(p,.89,.97);data.pieces=[{part:'left',x:x-28*separate,y:y-10*separate},{part:'right',x:x+28*separate,y:y+15*separate}];}
  }
  return data;
 }
 function hitStart(u,p){if(u.tab!==1||u.running||u.phase!==0)return false;return Math.abs(p.x-195)<=100&&p.y>=130&&p.y<=300;}
 function nearSite(p){return Math.abs(p.x-origin.x)<72&&Math.abs(p.y-origin.y)<80;}
 const api={profiles,origin,stagePoints,contour,substratePath,enzymePath,stage,scene,hitStart,nearSite};root.EnzymesGeometry=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
