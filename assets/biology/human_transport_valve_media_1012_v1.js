/* Licensed medical animation, enlarged as two simultaneous observation windows.
 * RWhitwam, adapted from DrJanaOfficial CG_Heart.gif, CC BY-SA 4.0.
 * Pixels and frame order unchanged; slowed to 4 seconds, cropped for readability.
 * This is an observation reference, NOT sound-synchronised patient footage.
 */
(function(root){
  'use strict';
  let sprite;
  const P=(a,b)=>[a,b];
  function load(){if(!sprite&&typeof Image!=='undefined'){sprite=new Image();sprite.src='assets/biology/human_transport_media_1012_v1/heart_valves_frames.webp';}return sprite;}
  function text(ctx,D,p,x,y,size=22,color='#f2ecd9',align='left'){ctx.save();ctx.font=`700 ${size}px "Noto Sans TC", "JetBrains Mono", sans-serif`;ctx.fillStyle=color;ctx.textAlign=align;ctx.fillText(D.tr(p),x,y);ctx.restore();}
  function crop(ctx,im,f,box,dest){const col=f%5,row=Math.floor(f/5),[x,y,w,h]=box,[dx,dy,dw,dh]=dest,k=Math.min(dw/w,dh/h);ctx.drawImage(im,col*800+x,row*600+y,w,h,dx+(dw-w*k)/2,dy+(dh-h*k)/2,w*k,h*k);}
  function draw(ctx,s,t,D){
    text(ctx,D,P('兩種瓣膜，一起放大看','Enlarge both valve types together'),24,36,28,'#fde047');
    const im=load(), f=Math.floor(((t%4)+4)%4/4*29)%29;
    D.round(ctx,20,74,406,450,16,'#17382e','#4b7362');
    D.round(ctx,442,74,498,220,16,'#17382e','#4b7362');
    D.round(ctx,442,308,498,216,16,'#17382e','#4b7362');
    if(im?.complete&&im.naturalWidth){
      crop(ctx,im,f,[170,25,475,540],[24,79,398,438]);
      crop(ctx,im,f,[427,209,125,139],[447,106,225,178]);
      crop(ctx,im,f,[326,123,112,103],[447,345,225,163]);
    }else text(ctx,D,P('醫學動畫載入中…','Loading medical animation…'),40,126);
    text(ctx,D,P('房室瓣','AV valve'),689,117,26,'#fde047');
    text(ctx,D,P('二尖瓣（原圖 C）','Mitral valve (C)'),689,153,20);
    text(ctx,D,P('心房 ⇢ 心室','Atrium ⇢ ventricle'),689,195,22);
    text(ctx,D,P('可看到瓣葉與腱索','Leaflets and chordae'),689,232,20,'#a5cbb6');
    text(ctx,D,P('半月瓣','Semilunar valve'),689,354,26,'#fde047');
    text(ctx,D,P('主動脈瓣（原圖 A）','Aortic valve (A)'),689,390,20);
    text(ctx,D,P('心室 ⇢ 主動脈','Ventricle ⇢ aorta'),689,433,22);
    text(ctx,D,P('沒有腱索','No chordae'),689,470,20,'#a5cbb6');
    text(ctx,D,P('醫學 3D 動畫・4 秒慢播；不是人體實拍。','Medical 3D animation · slowed to 4 s · not live footage.'),24,559,22);
    text(ctx,D,P('要對照 S1／S2，切換「開關與心音」。','For S1 / S2 timing, choose “Valves and sounds”.'),24,590,22,'#55e9ff');
    s.medicalFrame=f;D.status(P('兩個放大窗使用同一格影像，維持原圖的先後順序。','Both enlarged windows use the same frame, retaining the original order.'));
  }
  root.HumanTransportValveMedia=Object.freeze({draw,frames:29,period:4,crops:{av:[427,209,125,139],sl:[326,123,112,103]}});
})(globalThis);
