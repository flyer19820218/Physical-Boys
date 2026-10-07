/* Authorized V2 molecular replacement. Rate charts and apparatus delegate unchanged. */
(function(root){'use strict';
 const base=root.EnzymesDraw||(typeof require!=='undefined'?require('./enzymes_draw_v1.js'):null),G=root.EnzymesGeometry||(typeof require!=='undefined'?require('./enzymes_geometry_v2.js'):null);
 const tr=(l,z,e)=>l==='zh'?z:e;
 function background(c){c.clearRect(0,0,960,620);const g=c.createRadialGradient(480,330,10,480,330,600);g.addColorStop(0,'#285247');g.addColorStop(1,'#11261f');c.fillStyle=g;c.fillRect(0,0,960,620);c.lineJoin='round';c.lineCap='round';}
 function enzyme(c,s){c.save();c.translate(s.origin.x,s.origin.y);G.enzymePath(c,s.pocket);const g=c.createLinearGradient(-185,-80,190,120);g.addColorStop(0,'#d7fff6');g.addColorStop(.22,s.color);g.addColorStop(1,'#275f55');c.fillStyle=g;c.shadowColor='rgba(11,26,21,.6)';c.shadowBlur=15;c.shadowOffsetY=8;c.fill();c.shadowBlur=0;c.shadowOffsetY=0;c.strokeStyle='#c5f5ed';c.lineWidth=4;c.stroke();c.save();c.clip();c.strokeStyle='rgba(11,26,21,.15)';c.lineWidth=7;for(let i=0;i<6;i++){c.beginPath();c.moveTo(-196+i*30,72);c.bezierCurveTo(-170+i*40,25,-180+i*55,150,-95+i*47,92);c.stroke();}c.restore();c.beginPath();G.contour(c,s.pocket);c.strokeStyle=s.failed?'#f472b6':'#fde047';c.lineWidth=5;c.stroke();c.restore();}
 const colors={starch:['#fb923c','#f8bb55'],protein:['#f472b6','#f5a4d0'],fat:['#fb923c','#fde047']};
 function piece(c,id,p,failed){c.save();c.translate(p.x,p.y);const drawHalf=(side)=>{c.save();c.beginPath();c.rect(side===0?-130:0,-150,130,230);c.clip();G.substratePath(c,id);const g=c.createLinearGradient(0,-110,0,65);g.addColorStop(0,side===0?'#ffdab0':'#ffedc3');g.addColorStop(.28,colors[id][side]);g.addColorStop(1,side===0?'#be6532':'#b58536');c.fillStyle=g;c.fill();c.restore();};
 if(p.part!=='right')drawHalf(0);if(p.part!=='left')drawHalf(1);
 c.save();if(p.part!=='whole'){c.beginPath();c.rect(p.part==='left'?-130:0,-150,130,230);c.clip();}G.substratePath(c,id);c.strokeStyle=failed?'#f472b6':'#fff0d4';c.lineWidth=3;c.stroke();c.restore();
 if(p.part!=='whole'){c.strokeStyle='#fff0d4';c.lineWidth=2;c.beginPath();c.moveTo(0,-102);c.lineTo(0,52);c.stroke();}
 c.restore();}
 function bond(c,x,y,amount){if(amount<=0)return;c.save();c.globalAlpha=amount;c.strokeStyle='#f2ecd9';c.lineWidth=7;c.beginPath();c.moveTo(x-17,y-28);c.lineTo(x+17,y-28);c.stroke();for(const dx of [-21,21]){c.beginPath();c.arc(x+dx,y-28,5,0,Math.PI*2);c.fillStyle='#fff1d2';c.fill();}c.restore();}
 function molecular(c,u,l){background(c);const s=G.scene(u),label=base.label;
 const title=u.tab===0?tr(l,s.join?'合成：兩個部分接成完整產物':'分解：完整受質分成兩個部分',s.join?'Synthesis: two parts become one':'Breakdown: one substrate becomes two'):tr(l,s.match?'形狀吻合，才能結合並反應':'形狀不合，不能催化這個受質',s.match?'Matching shapes allow binding':'A mismatch does not react');label(c,title,480,49,860,'#fde047');
 label(c,tr(l,s.join?'受質一':'受質',s.join?'Substrate 1':'Substrate'),195,97,260,'#fb923c');label(c,tr(l,s.join&&s.phase<.66?'受質二':s.join?'完整產物':'分解產物',s.join&&s.phase<.66?'Substrate 2':s.join?'Joined product':'Products'),790,97,230,s.join&&s.phase<.66?'#f8bb55':'#4ade80');
 enzyme(c,s);for(const p of s.pieces)piece(c,s.id,p,s.failed);
 const same=s.pieces.length===1||s.pieces.every(p=>Math.abs(p.x-s.pieces[0].x)<.01&&Math.abs(p.y-s.pieces[0].y)<.01);
 if(same&&s.bond>0)bond(c,s.pieces[0].x,s.pieces[0].y,s.bond);
 // Active-site leader stays below the pocket, clear of substrate trajectories.
 c.beginPath();c.moveTo(480,413);c.lineTo(480,424);c.strokeStyle='#fde047';c.lineWidth=3;c.stroke();label(c,tr(l,'活性區','Active site'),480,441,200,'#fde047');
 label(c,tr(l,'酵素保留，可再次使用','Enzyme remains; reusable'),480,490,410,'#55e9ff');
 const names=[['靠近','Approach'],['吻合','Bind'],[s.join?'接合':'分解',s.join?'Join':'Split'],['釋放','Release']];
 for(let i=0;i<4;i++){const x=132+i*232;label(c,s.failed&&i===1?tr(l,'不吻合','No fit'):tr(l,...names[i]),x,538,210,i===s.stage?'#fde047':'#afc6bb');if(i===s.stage){c.strokeStyle='#fde047';c.lineWidth=4;c.beginPath();c.moveTo(x-75,568);c.lineTo(x+75,568);c.stroke();}}
 label(c,tr(l,'原創形狀配對示意 · 非真實分子構造或比例','Original shape-fit model · not molecular structures or scale'),480,596,925);
 }
 const api={...base,molecular};root.EnzymesDraw=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
