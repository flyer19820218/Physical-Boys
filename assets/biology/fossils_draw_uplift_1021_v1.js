/* Fossils · "How a sea became a mountain" (environment tab, view 2), 2026-10-21.
 * One cross-section that evolves through four steps: a warm shallow sea with a reef; the reef buried by sediment
 * and turned to fossil; the whole rock block lifted into a mountain while the sea level stays fixed; weathering and
 * a river cut a cliff that exposes the coral fossil. Picture: coral_reef_today.jpg (AI illustration), a small crop
 * in a magnifier frame only. Colours: living coral pink, coral fossil yellow, sediment sand, uplift green,
 * weathering debris orange, sea level cyan.
 */
(()=>{'use strict';
const K=window.FossilKit,{P,C,text,pill,cpill,arrow,dashed,circle,ellipse,line,sline,glow,pulse,stageClock,fade,smooth,mix,clamp,mod,drawIn,measure,D,rgba,rng}=K;
const N=4,PER=7;
const SHORT=[P(`暖淺海`,`Warm sea`),P(`被泥沙蓋住`,`Buried`),P(`地殼抬升`,`Uplift`),P(`山壁露出`,`Cliff exposed`)];

// ── geometry ───────────────────────────────────────────────────────────────
const SEA=220;                       // fixed sea level (never moves)
const OLD=380;                       // sea floor where the reef grew
const NEW_TOPS=[340,306,272];        // tops of the three sediment layers laid over the reef (A, B, C)
const NEW_COLS=['#a08a66','#b29d74','#c6b386'];
const OLD_TOPS=[OLD,425,478,540],OLD_COLS=['#8a7b62','#76806e','#675e50','#4f4a42'],BOTTOM=720;
const SKIM=10;                       // weathering strips a little off the whole surface
const CX=380,WD=330,LIFT=35,AMP=175; // uplift: even lift + broad dome
const lift=x=>LIFT*(1-.7*smooth((x-700)/260))+AMP*Math.exp(-(((x-CX)/WD)**4));   // the far right (open sea) rises less
const XS=[];for(let x=-16;x<=976;x+=8)XS.push(x);
const CORALS=[{x:470,h:32,s:1},{x:510,h:38,s:2},{x:548,h:33,s:3}];
const RAIN=C.cyan,SED=C.sand,FOSSIL=C.yellow,LIVE=C.pink,UPC=C.green,EROS=C.orange;

// the exposed coral (rightmost clump) after uplift
const FX=CORALS[2].x,FB=OLD-lift(FX),FT=FB-CORALS[2].h;
const S1=x=>NEW_TOPS[2]-lift(x);     // land surface after uplift, before weathering
// carved profile (after uplift): a cliff face just right of the coral, a ledge, a river, then down to the sea
const EP=[[FX-61,-999],[FX-60,S1(FX-60)+SKIM],[FX+2,S1(FX)+SKIM+14],[FX+16,FT-14],[FX+20,FB+22],[FX+60,FB+23],[FX+130,FB+25],
  [FX+150,FB+31],[FX+180,FB+31],[FX+196,FB+26],[FX+220,FB+30],[FX+250,232],[FX+300,252],[1000,262]];
function ep(x){if(x<=EP[0][0])return -999;for(let i=1;i<EP.length;i++)if(x<=EP[i][0]){const a=EP[i-1],b=EP[i];return mix(a[1],b[1],(x-a[0])/(b[0]-a[0]));}return -999;}

// ── small pictures drawn in code ──────────────────────────────────────────
function coral(c,x,y,h,seed,col,a=1){
  c.save();c.globalAlpha*=a;const r=rng(seed*97+3);
  const tips=[[0,-h],[-h*.45,-h*.72],[h*.42,-h*.78],[-h*.25,-h*.42],[h*.22,-h*.5]];
  sline(c,[[x,y],[x,y-h*.55]],col,5);
  tips.forEach(([dx,dy],i)=>{const mx=x+dx*.35,my=y-h*.45;sline(c,[[x,y-h*.3],[mx,my],[x+dx,y+dy]],col,i?3.5:4.5);circle(c,x+dx,y+dy,3.2+r()*1.2,col);});
  c.restore();
}
function fish(c,x,y,dir,t,a=1){
  c.save();c.globalAlpha*=a;c.translate(x,y);c.scale(dir,1);
  const w=Math.sin(t*9)*3;
  ellipse(c,0,0,15,7,'#e9e2c9');
  c.beginPath();c.moveTo(-12,0);c.lineTo(-24,-7+w*.4);c.lineTo(-24,7+w*.4);c.closePath();c.fillStyle='#e9e2c9';c.fill();
  circle(c,7,-1.5,1.8,C.ink);
  c.restore();
}
function person(c,x,y,t,a=1){
  c.save();c.globalAlpha*=a;const col=C.white;
  circle(c,x,y-50,8,col);
  sline(c,[[x,y-41],[x,y-18]],col,4);
  sline(c,[[x,y-18],[x-7,y]],col,4);sline(c,[[x,y-18],[x+7,y]],col,4);
  sline(c,[[x,y-35],[x+9,y-25]],col,3.5);
  const wv=Math.sin(t*2.2)*2;                           // pointing arm (towards the cliff, on the left)
  sline(c,[[x,y-35],[x-20,y-42+wv]],col,3.5);
  c.restore();
}
function bigUp(c,x,y0,y1,w,col,t,a=1){
  c.save();c.globalAlpha*=a;
  c.beginPath();c.moveTo(x-w/2,y0);c.lineTo(x-w/2,y1+w*.9);c.lineTo(x-w,y1+w*.9);c.lineTo(x,y1);c.lineTo(x+w,y1+w*.9);c.lineTo(x+w/2,y1+w*.9);c.lineTo(x+w/2,y0);c.closePath();
  c.fillStyle=rgba(col,.85);c.fill();c.strokeStyle=C.ink;c.lineWidth=2.5;c.stroke();
  c.clip();
  for(let i=0;i<4;i++){const yy=y0-mod(t*28+i*(y0-y1)/4,y0-y1);sline(c,[[x-w/3,yy+10],[x,yy],[x+w/3,yy+10]],rgba(C.ink,.55),3.5);}
  c.restore();
}

// ── progress rail ──────────────────────────────────────────────────────────
function rail(c,k,t){
  const X0=36,GAP=40,Y=34;
  line(c,[[X0,Y],[X0+GAP*(N-1),Y]],rgba(C.muted,.45),3);
  for(let i=0;i<N;i++){
    const x=X0+GAP*i,on=i===k;
    if(on)pulse(c,x,Y,t,C.yellow,13);
    circle(c,x,Y,13,on?C.yellow:i<k?rgba(C.muted,.85):C.deep,on?C.white:C.muted,2);
    c.save();c.font=K.MONO(20);c.fillStyle=on||i<k?C.ink:C.muted;c.textAlign='center';c.textBaseline='middle';c.fillText(String(i+1),x,Y+1);c.restore();
    D.hit(x-18,Y-18,36,36,'phase',i);
  }
  text(c,SHORT[k],X0+GAP*(N-1)+28,Y+8,24,C.yellow);
}

// ── main ───────────────────────────────────────────────────────────────────
function draw(c,s,t){
  const {k,tau}=stageClock(s,t,N,PER);
  s.shown=k;
  if(s.upK!==k){s.upJump=(s.upK===k-1)?-1:t;s.upK=k;}
  const jump=s.upJump>=0?clamp((t-s.upJump)/.7):1;

  // progress of each process
  const sedA=k<1?0:k>1?1:smooth((tau-.6)/1.8);
  const sedB=k<1?0:k>1?1:smooth((tau-2.4)/1.6);
  const sedC=k<1?0:k>1?1:smooth((tau-4.0)/1.6);
  const fos=k<1?0:k>1?1:smooth((tau-2.0)/1.4);
  const U=k<2?0:k>2?1:smooth((tau-.8)/4.6);
  const ER=k<3?0:smooth((tau-.8)/4.4);

  // flat (pre-uplift) layer tops, top → bottom
  const bA=mix(OLD,NEW_TOPS[0],sedA),bB=bA-sedB*(NEW_TOPS[0]-NEW_TOPS[1]),bC=bB-sedC*(NEW_TOPS[1]-NEW_TOPS[2]);
  const tops=[bC,bB,bA,...OLD_TOPS],cols=[NEW_COLS[2],NEW_COLS[1],NEW_COLS[0],...OLD_COLS];
  const W=(x,y)=>y-U*lift(x);
  const surf0=x=>W(x,bC);
  const T=x=>{const s0=surf0(x);return ER?mix(s0,Math.max(s0+SKIM,ep(x)),ER):s0;};
  const TS=XS.map(T);

  // sea (rock is drawn over it, so only the part above the rock shows)
  c.save();c.fillStyle=rgba(C.sea,.55);c.fillRect(0,SEA,960,600-SEA);c.restore();

  // rock layers
  for(let i=0;i<tops.length;i++){
    const top=XS.map((x,j)=>Math.max(W(x,tops[i]),TS[j])),bot=XS.map((x,j)=>i+1<tops.length?Math.max(W(x,tops[i+1]),TS[j]):BOTTOM);
    c.beginPath();XS.forEach((x,j)=>j?c.lineTo(x,top[j]):c.moveTo(x,top[j]));for(let j=XS.length-1;j>=0;j--)c.lineTo(XS[j],bot[j]);c.closePath();
    c.fillStyle=cols[i];c.fill();
    sline(c,XS.map((x,j)=>[x,top[j]]),rgba(C.ink,.55),2);
    if(i>=3&&i<6){const mid=(tops[i]+tops[i+1])/2;   // bedding inside the old layers
      c.save();c.setLineDash([10,8]);sline(c,XS.map((x,j)=>[x,Math.max(W(x,mid),TS[j])]),rgba(C.ink,.28),1.5);c.restore();}
  }
  // ground surface edge
  sline(c,XS.map((x,j)=>[x,TS[j]]),rgba(C.white,.35),2);

  // corals / fossils (stay attached to the rock as it rises)
  CORALS.forEach((cr,i)=>{
    const by=W(cr.x,OLD),exposed=i===2;
    const col=fos>=1?FOSSIL:fos>0?mixHex(LIVE,FOSSIL,fos):LIVE;
    const dim=k===3&&!exposed?.55:1;
    coral(c,cr.x,by,cr.h,cr.s,col,dim);
  });

  // fish (steps 1–2; they stay in the water as it shallows, then leave)
  const fishA=k<2?1:k===2?1-clamp(U*3):0;
  const fishY=mix(292,244,(sedA+sedB+sedC)/3);
  const fishX=ph=>mix(320,470,.5+.5*Math.sin(ph));
  if(fishA>0){
    [[0,0],[-34,16],[-60,-8]].forEach(([dx,dy],i)=>{
      const ph=t*.45+i*.25,y=fishY+dy*(1-sedC*.6)+Math.sin(t*1.3+i)*3,dir=Math.cos(ph)>=0?1:-1;
      fish(c,fishX(ph)+dx,y,dir,t+i,fishA);
    });
  }

  // sediment falling
  if(k===1||(k===2&&U<.2)){
    const R=rng(11),a=k===1?1:1-U*5;
    for(let i=0;i<46;i++){
      const x0=390+R()*270,sp=.16+R()*.1,ph=mod(t*sp+R()),xx=x0+Math.sin(t*.8+i)*6,yb=W(xx,bC);
      const y=mix(SEA+12,yb-3,ph),al=Math.min(1,ph*5,(1-ph)*6)*a;
      if(al>0)circle(c,xx,y,2.6+R()*1.4,rgba(SED,.9*al));
    }
  }

  // sea level (fixed): drawn only over sea and sky
  const seaTxt=k>=2?P(`海平面（不動）`,`Sea level (fixed)`):P(`海平面`,`Sea level`);
  c.save();c.setLineDash([12,8]);
  for(let j=1;j<XS.length;j++){if(TS[j]>SEA+1&&TS[j-1]>SEA+1)line(c,[[XS[j-1],SEA],[XS[j],SEA]],C.cyan,3);}
  c.restore();
  text(c,seaTxt,940,SEA-12,22,C.cyan,'right');

  // ── step 1: reef, fish, magnifier
  const a1=k===0?fade(tau,.4):k===1?1-fade(tau,0,.6):0;
  if(a1>0){
    c.save();c.globalAlpha*=a1;
    const R0={x:612,y:58,w:204,h:146};
    D.round(c,R0.x-5,R0.y-5,R0.w+10,R0.h+10,16,C.deep,C.cyan);
    drawIn(c,'coral_reef_today.jpg',R0,{radius:12,crop:[.12,.5,.34,.44]});
    cpill(c,P(`珊瑚礁（造礁珊瑚）`,`Reef-building coral`),R0.x+R0.w/2,8,{color:C.pink,maxX:950});
    const rc=[509,OLD-18];
    c.save();c.setLineDash([6,6]);circle(c,rc[0],rc[1],52,null,rgba(C.cyan,.85),2.5);c.restore();
    dashed(c,[[R0.x-4,R0.y+R0.h],[rc[0]+44,rc[1]-28]],rgba(C.cyan,.85),2.5);
    pulse(c,rc[0],rc[1],t,C.yellow,46);
    pill(c,P(`珊瑚`,`Coral`),600,322,{color:LIVE});
    const fp=pill(c,P(`魚`,`Fish`),24,300,{color:C.white});
    dashed(c,[[fp.x+fp.w+4,fp.y+fp.h/2],[fishX(t*.45+.5)-70,fishY+4]],rgba(C.white,.6),2);
    c.restore();
  }
  // sea label while the sea is here
  const aSea=k<2?1:k===2?1-clamp(U*2.5):0;
  if(aSea>0){c.save();c.globalAlpha*=aSea;pill(c,P(`溫暖的淺海`,`Warm shallow sea`),24,228,{color:C.cyan});c.restore();}
  if(k>=2&&U>.6){c.save();c.globalAlpha*=clamp((U-.6)*3);text(c,P(`海`,`Sea`),940,SEA+30,22,C.cyan,'right');c.restore();}

  // rock label
  pill(c,P(`岩層（沉積岩）`,`Rock layers`),24,W(80,520)-20,{color:C.muted,maxX:600});

  // ── step 2: sediment, new layers, fossil
  if(k===1){
    const a=fade(tau,.4);c.save();c.globalAlpha*=a;
    const sp=pill(c,P(`泥沙`,`Mud & sand`),700,232,{color:SED});
    dashed(c,[[sp.x-4,sp.y+sp.h/2],[650,262]],rgba(SED,.8),2);
    c.restore();
    const an=fade(tau,2.6);
    if(an>0){c.save();c.globalAlpha*=an;pill(c,P(`新的岩層`,`New layers`),700,mix(bA,bC,.5)-20,{color:SED});c.restore();}
  }
  // fossil label (steps 2–3)
  if((k===1&&fos>0)||k===2){
    const a=k===1?fos:1,fx=CORALS[2].x,fy=W(fx,OLD);
    c.save();c.globalAlpha*=a;
    if(k===1)pulse(c,CORALS[1].x,fy-18,t,C.yellow,28);
    pill(c,P(`珊瑚化石`,`Coral fossil`),fx+40,fy+4,{color:FOSSIL});
    c.restore();
  }

  // ── step 3: uplift
  if(k===2){
    const a=fade(tau,.2);
    const ax=250,y0=W(ax,600),y1=W(ax,470);
    bigUp(c,ax,y0,y1,36,UPC,t,a);
    c.save();c.globalAlpha*=a;
    pill(c,P(`地殼抬升`,`Crust rises`),ax+46,W(ax,500),{color:UPC,maxX:900});
    pill(c,P(`要很久，幾百萬年`,`Takes millions of years`),ax+46,W(ax,552),{color:C.white,maxX:900});
    c.restore();
    if(U>.55){const am=clamp((U-.55)*3);c.save();c.globalAlpha*=am;
      cpill(c,P(`山`,`Mountain`),CX+60,S1(CX+60)-50,{color:C.white});
      pill(c,P(`陸地`,`Land`),24,S1(40)-56,{color:C.white});
      c.restore();}
  }

  // ── step 4: weathering, river, cliff, person
  if(k===3){
    const a=fade(tau,.2);
    c.save();c.globalAlpha*=a;
    // rain
    const R=rng(5);
    for(let i=0;i<46;i++){
      const x0=90+R()*720,sp=200+R()*80,ph=R()*400,yy=50+mod(t*sp+ph,250),xx=x0-(yy-50)*.18;
      if(yy<T(xx)-6)sline(c,[[xx,yy],[xx+3,yy-15]],rgba(RAIN,.75),2);
    }
    pill(c,P(`雨`,`Rain`),24,74,{color:RAIN});
    // wind (blowing from the sea towards the cliff)
    for(let i=0;i<4;i++){
      const u=mod(t*.22+i*.25),x=mix(930,780,u),y=58+i*14,al=Math.sin(Math.PI*u);
      c.save();c.globalAlpha*=al;sline(c,[[x,y],[x-26,y-4],[x-52,y+2]],rgba(C.white,.8),2.5);c.restore();
    }
    pill(c,P(`風`,`Wind`),880,14,{color:C.white,maxX:950});
    // river along the ledge into the sea
    const riv=[];for(let x=FX+124;x<=FX+250;x+=4)riv.push([x,T(x)-3]);
    sline(c,riv,rgba(C.sea,.95),7);
    c.save();c.setLineDash([10,12]);c.lineDashOffset=-t*30;sline(c,riv,rgba(C.cyan,.9),2.5);c.restore();
    pill(c,P(`河流`,`River`),FX+140,FB+46,{color:C.cyan,maxX:780});
    // debris: down the face, along the ledge and the river to the sea
    const path=[];for(let x=FX-20;x<=FX+300;x+=2)path.push([x,T(x)-4]);
    const L=[0];for(let j=1;j<path.length;j++)L.push(L[j-1]+Math.hypot(path[j][0]-path[j-1][0],path[j][1]-path[j-1][1]));
    const tot=L[L.length-1];
    for(let i=0;i<16;i++){
      const d=mod(t*36+i*tot/16,tot);let j=1;while(j<L.length-1&&L[j]<d)j++;
      const u=(d-L[j-1])/Math.max(1e-6,L[j]-L[j-1]),q=[mix(path[j-1][0],path[j][0],u),mix(path[j-1][1],path[j][1],u)];
      circle(c,q[0],q[1],3.4,rgba(EROS,.95*Math.min(1,(tot-d)/40,d/20)));
    }
    const ep1=pill(c,P(`風化、侵蝕`,`Weathering`),FX+240,134,{color:EROS,maxX:950});
    dashed(c,[[ep1.x+30,ep1.y+ep1.h],[FX+110,T(FX+110)-8]],rgba(EROS,.8),2);
    c.restore();

    // exposed fossil, person, link back to the old sea floor
    const ap=fade(tau,3.6);
    if(ap>0){
      c.save();c.globalAlpha*=ap;
      const gx=FX+70,gy=T(gx);
      person(c,gx,gy,t);
      pill(c,P(`看到化石`,`Sees the fossil`),gx-8,gy-110,{color:C.white,maxX:784});
      pulse(c,FX,FB-16,t,C.yellow,22);
      const fp=pill(c,P(`珊瑚化石`,`Coral fossils`),FX-280,FB+8,{color:FOSSIL});
      dashed(c,[[fp.x+fp.w+4,fp.y+fp.h/2],[CORALS[0].x-12,W(CORALS[0].x,OLD)-6]],rgba(FOSSIL,.85),2);
      const cp=pill(c,P(`山壁`,`Cliff`),FX-40,14,{color:C.white,maxX:740});
      dashed(c,[[cp.x+cp.w/2,cp.y+cp.h],[FX+16,FT-4]],rgba(C.white,.75),2);
      // where it used to be
      c.save();c.setLineDash([8,7]);line(c,[[FX-130,OLD],[FX+60,OLD]],rgba(C.cyan,.9),2.5);c.restore();
      dashed(c,[[FX-6,FB+8],[FX-6,OLD-30]],rgba(C.cyan,.9),2.5,[7,6],-t*12);
      arrow(c,FX-6,OLD-34,FX-6,OLD-4,C.cyan,3);
      pill(c,P(`以前是海底`,`Once the sea floor`),FX+24,OLD-20,{color:C.cyan,maxX:950});
      c.restore();
    }
  }

  rail(c,k,t);

  if(jump<1){c.save();c.globalAlpha=1-jump;c.fillStyle='#11261f';c.fillRect(-40,-40,1040,680);c.restore();rail(c,k,t);}
}
function mixHex(a,b,u){const p=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)),A=p(a),B=p(b);return '#'+A.map((v,i)=>Math.round(mix(v,B[i],u)).toString(16).padStart(2,'0')).join('');}
window.FossilDraw.uplift=draw;
})();
