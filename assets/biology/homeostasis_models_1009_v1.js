/* New homeostasis models; no older drawing functions or coordinates are changed. */
(()=>{'use strict';
const M=window.CoordinationModels,{D,C,pair:P,label,polygon}=M;
function glucose(c,x,y,r=17){polygon(c,x,y,r,6,C.yellow);}
function glycogen(c,x,y,r=11){for(const [dx,dy] of [[0,0],[1.7,0],[3.4,0],[1.7,-1.5],[3.4,1.5]])glucose(c,x+dx*r,y+dy*r,r);}
function ellipse(c,x,y,rx,ry,fill,stroke){c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=3;c.stroke();}}
function heading(c,p,x=28,y=36,w=890){label(c,p,x,y,w,C.yellow,26);}
function foot(c,p){label(c,p,28,570,904,C.cyan,22);}
function card(c,p,x,y,w=270,h=95,color=C.panel){D.round(c,x,y,w,h,14,color,'#47675d');label(c,p,x+16,y+32,w-32,C.white,24);}
function lungModel(c,x,y,phase,scale=1){
 c.save();c.translate(x,y);c.scale(scale,scale);
 const expansion=phase==='in'?1:0,rx=68+20*expansion,ry=102+26*expansion;
 D.round(c,-170,-175,340,375,70,'#f2ecd915','#e8ccab');
 D.round(c,-14,-205,28,108,8,'#e8ccab');D.line(c,[[0,-120],[-68,-70]],'#e8ccab',15);D.line(c,[[0,-120],[68,-70]],'#e8ccab',15);
 ellipse(c,-85,0,rx,ry,'#e6a9b1','#f2ecd9');ellipse(c,85,0,rx,ry,'#e6a9b1','#f2ecd9');
 c.beginPath();c.moveTo(-162,145);c.quadraticCurveTo(0,phase==='in'?130:35,162,145);c.lineTo(162,183);c.lineTo(-162,183);c.closePath();c.fillStyle='#c88574';c.fill();c.strokeStyle=C.white;c.lineWidth=3;c.stroke();
 c.restore();
}
function vessel(c,x,y,w,h,color){const g=c.createLinearGradient(x,y,x+w,y);g.addColorStop(0,color);g.addColorStop(.5,'#f2ecd9');g.addColorStop(1,color);D.round(c,x,y,w,h,Math.min(20,w/2),g,color);}
window.HomeostasisModels={...M,glucose,glycogen,ellipse,heading,foot,card,lungModel,vessel};
})();
