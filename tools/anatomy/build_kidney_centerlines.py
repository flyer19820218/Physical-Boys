#!/usr/bin/env python3
"""build_kidney_centerlines.py -- 從 si_scene_v1.glb 的網格估出「腎臟路線」的血管中心線，並產生腎內的示意小分支。

用法（在 repo 根目錄）：
  node tools/anatomy/dump_glb_world.mjs assets/biology/anatomy3d/si_scene_v1.glb /tmp/si_world.json --modules /tmp/gl/node_modules
  python3 tools/anatomy/build_kidney_centerlines.py /tmp/si_world.json assets/biology/anatomy3d/kidney_centerlines_v1.json

與 build_si_centerlines.py 的關係：下面「方法函式」那一段是從它原樣複製的（中心線估計、切面、射線檢查；不 import 它，因為它是會直接執行的腳本），
小腸／肝的部分不在這支裡。

內容：
  * mesh 段（schematic=false）：心室出口→主動脈（升、弓、胸、腹到腎動脈起點）、腹主動脈下段、左右腎動脈主幹與前後支、左右腎靜脈、下腔靜脈（腎靜脈以下／以上）。
    中心線與半徑都由網格估出（半徑＝切面環面積換算），不手填。
  * generated 段（schematic=true）：腎臟內部的示意路徑——葉間動脈→弓狀動脈→小葉間動脈→入球小動脈（kart）、腎絲球（kglom，螺旋放大）、
    出球小動脈與管周微血管網（kcap，每支 2～3 條交織）、小葉間→弓狀→葉間靜脈到腎門匯入腎靜脈（kven）；下腔靜脈上端接右心房的一小段。
    腎內血管口徑與走向資料集沒有，全部是示意（口徑放大）；名稱與順序的出處見 assets/biology/anatomy3d/sources.md「腎臟場景」。
  * 驗證：mesh 段每一點往外偏 0.5 r，向 8 個垂直方向射線必須在 4 r 內打到該血管網格；腎內示意點必須在腎囊網格的凸包內（內縮 0.5 mm；腎囊是腎門處開口的薄殼，射線法不可靠）。
需要：numpy、scipy。
"""
import json,sys,numpy as np
from collections import defaultdict
from scipy.sparse import coo_matrix
from scipy.sparse.csgraph import dijkstra, connected_components
from scipy.spatial import cKDTree
D=json.load(open(sys.argv[1]))
_MC={}
def subdiv(P,T):
  E=np.sort(np.vstack([T[:,[0,1]],T[:,[1,2]],T[:,[2,0]]]),axis=1)
  U,inv=np.unique(E,axis=0,return_inverse=True);inv=inv.reshape(3,-1).T
  M=(P[U[:,0]]+P[U[:,1]])/2;base=len(P);P2=np.vstack([P,M]);m=inv+base
  a,b,c=T[:,0],T[:,1],T[:,2];ab,bc,ca=m[:,0],m[:,1],m[:,2]
  T2=np.vstack([np.stack([a,ab,ca],1),np.stack([ab,b,bc],1),np.stack([ca,bc,c],1),np.stack([ab,bc,ca],1)])
  return P2,T2
def mesh(i):
  if i in _MC: return _MC[i]
  P=np.array(D[i]['P']).reshape(-1,3);T=np.array(D[i]['I']).reshape(-1,3)
  while True:
    e=np.linalg.norm(P[T[:,0]]-P[T[:,1]],axis=1).max()
    if e<0.004 or len(T)*4>150000: break
    P,T=subdiv(P,T)
  _MC[i]=(P,T);return P,T
def graph(P,T):
  e=np.vstack([T[:,[0,1]],T[:,[1,2]],T[:,[2,0]]]);w=np.linalg.norm(P[e[:,0]]-P[e[:,1]],axis=1);n=len(P)
  return coo_matrix((np.r_[w,w],(np.r_[e[:,0],e[:,1]],np.r_[e[:,1],e[:,0]])),shape=(n,n)).tocsr()
def loops(P,T):
  cnt=defaultdict(int)
  for t in T:
    for a,b in ((t[0],t[1]),(t[1],t[2]),(t[2],t[0])): cnt[(min(a,b),max(a,b))]+=1
  adj=defaultdict(list)
  for (a,b),v in cnt.items():
    if v==1: adj[a].append(b);adj[b].append(a)
  seen=set();out=[]
  for s in adj:
    if s in seen: continue
    comp=[];st=[s]
    while st:
      x=st.pop()
      if x in seen: continue
      seen.add(x);comp.append(x);st+=adj[x]
    out.append(np.array(comp))
  return out
def loop_near(P,T,pt):
  L=loops(P,T);return min(L,key=lambda c:np.linalg.norm(P[c].mean(0)-pt))
def resample(pts,step):
  d=np.r_[0,np.cumsum(np.linalg.norm(np.diff(pts,axis=0),axis=1))];n=max(2,int(round(d[-1]/step))+1)
  s=np.linspace(0,d[-1],n);return np.stack([np.interp(s,d,pts[:,k]) for k in range(3)],1),d[-1]
def smooth(a,k=2):
  if len(a)<5: return a
  b=a.copy()
  for i in range(1,len(a)-1):
    lo,hi=max(0,i-k),min(len(a),i+k+1);b[i]=a[lo:hi].mean(0)
  return b
def tube_cl(mid,a,b,nbins=None,step=0.002):
  """level-set centerline between the open boundary loops nearest a and b (or nearest vertex)"""
  P,T=mesh(mid);G=graph(P,T)
  def src(pt):
    L=loops(P,T)
    if L:
      c=min(L,key=lambda c:np.linalg.norm(P[c].mean(0)-pt))
      if np.linalg.norm(P[c].mean(0)-pt)<0.004: return c
    return np.array([np.argmin(np.linalg.norm(P-pt,axis=1))])
  A=src(np.array(a));dA=dijkstra(G,indices=A,min_only=True)
  Ls=[c for c in loops(P,T) if np.isfinite(dA[c[0]]) and np.linalg.norm(P[c].mean(0)-np.array(b))<0.004]
  B=Ls[0] if Ls else np.array([min(np.where(np.isfinite(dA))[0],key=lambda i:np.linalg.norm(P[i]-np.array(b)))])
  dB=dijkstra(G,indices=B,min_only=True)
  L=dB[A].min();r0=np.linalg.norm(P[A]-P[A].mean(0),axis=1).mean()
  ok=np.isfinite(dA)&np.isfinite(dB)
  tol=max(0.002,2.5*r0)
  on=ok&(dA+dB<=L+tol)
  t=dA/(dA+dB+1e-12)
  n=nbins or max(6,int(L/0.003))
  pts=[];rad=[]
  for k in range(n+1):
    m=on&(np.abs(t-k/n)<=0.5/n)
    if m.sum()<4: continue
    c=P[m].mean(0);pts.append(c);rad.append(np.linalg.norm(P[m]-c,axis=1).mean())
  pts=np.array(pts);rad=np.array(rad)
  # exact ends at loop centroids
  pts[0]=P[A].mean(0) if len(A)>1 else pts[0];pts[-1]=P[B].mean(0) if len(B)>1 else pts[-1]
  pts=smooth(pts,1);pts[0]=P[A].mean(0) if len(A)>1 else pts[0];pts[-1]=P[B].mean(0) if len(B)>1 else pts[-1]
  rp,length=resample(pts,step)
  idx=cKDTree(pts).query(rp)[1];rr=smooth(rad[idx][:,None],2)[:,0]
  for it in range(3):
    rp,rr,_=refine(P,T,rp,rr)
    rp[0]=pts[0];rp[-1]=pts[-1]
    rp=smooth(rp,1);rp[0]=pts[0];rp[-1]=pts[-1]
    n0=len(rr);rp,_=resample(rp,step);rr=np.interp(np.linspace(0,1,len(rp)),np.linspace(0,1,n0),rr)
  rp,rr,q=refine(P,T,rp,np.interp(np.linspace(0,1,len(rp)),np.linspace(0,1,len(rr)),rr),move=False)
  return rp,rr,q
def refine(P,T,pts,rad,move=True):
  tan=np.gradient(pts,axis=0);tan/=np.linalg.norm(tan,axis=1)[:,None]+1e-12
  out=pts.copy();rr=rad.copy();q=[]
  for i,(c,t) in enumerate(zip(pts,tan)):
    b=best_ring(P,T,c,t,max(4*rad[i],0.006))
    if b is None: q.append((0,360));continue
    cen,A,L,closed=b
    if move: out[i]=cen
    rr[i]=np.sqrt(A/np.pi)
    d=np.linalg.norm(L-c,axis=1)
    q.append((d.min()/rr[i],0 if closed else 360))
  return out,rr,np.array(q)

# ---- plane slices ----
def slice_loops(P,T,c,t,maxr):
  """intersection loops of plane (c,t) with mesh, limited to triangles near c"""
  s=(P-c)@t
  near=np.linalg.norm(P-c,axis=1)<maxr
  Tn=T[near[T].any(1)]
  sg=s[Tn];cross=(sg.min(1)<0)&(sg.max(1)>0);Tn=Tn[cross]
  segs=[];
  for tri in Tn:
    pts=[]
    for a,b in ((tri[0],tri[1]),(tri[1],tri[2]),(tri[2],tri[0])):
      if (s[a]<0)!=(s[b]<0):
        key=(min(a,b),max(a,b));f=s[a]/(s[a]-s[b]);pts.append((key,P[a]+(P[b]-P[a])*f))
    if len(pts)==2: segs.append(pts)
  adj=defaultdict(list);pos={}
  for (k1,p1),(k2,p2) in segs:
    adj[k1].append(k2);adj[k2].append(k1);pos[k1]=p1;pos[k2]=p2
  seen=set();loops=[]
  for k in adj:
    if k in seen: continue
    chain=[k];seen.add(k);cur=k;prev=None
    while True:
      nx=[n for n in adj[cur] if n!=prev and n not in seen]
      if not nx: break
      prev,cur=cur,nx[0];seen.add(cur);chain.append(cur)
    closed=len(chain)>2 and k in adj[chain[-1]]
    loops.append((np.array([pos[x] for x in chain]),closed))
  return loops
def basis(t):
  a=np.array([0,1,0]) if abs(t[1])<.9 else np.array([1,0,0]);u=np.cross(t,a);u/=np.linalg.norm(u);v=np.cross(t,u);return u,v
def winding(poly2,p):
  w=0
  for i in range(len(poly2)):
    a=poly2[i]-p;b=poly2[(i+1)%len(poly2)]-p
    w+=np.arctan2(a[0]*b[1]-a[1]*b[0],a@b)
  return abs(w)>np.pi
def area_centroid(poly2):
  x,y=poly2[:,0],poly2[:,1];x1,y1=np.roll(x,-1),np.roll(y,-1);cr=x*y1-x1*y;A=cr.sum()/2
  if abs(A)<1e-12: return poly2.mean(0),0
  return np.array([((x+x1)*cr).sum(),((y+y1)*cr).sum()])/(6*A),abs(A)
def best_ring(P,T,c,t,maxr):
  u,v=basis(t);best=None
  for L,closed in slice_loops(P,T,c,t,maxr):
    if len(L)<5: continue
    q=np.stack([(L-c)@u,(L-c)@v],1)
    if not winding(q,np.zeros(2)): continue
    cen,A=area_centroid(q)
    if best is None or A<best[1]: best=(c+cen[0]*u+cen[1]*v,A,L,closed)
  return best

# ---- ray containment ----
def ray_hits(P,T,o,d,maxd):
  v0=P[T[:,0]];e1=P[T[:,1]]-v0;e2=P[T[:,2]]-v0
  h=np.cross(d,e2);a=(e1*h).sum(1);ok=np.abs(a)>1e-14
  f=np.where(ok,1/np.where(ok,a,1),0);s=o-v0;u=f*(s*h).sum(1);q=np.cross(s,e1);v=f*(q@d) if False else f*(q*d).sum(1)
  t=f*(e2*q).sum(1)
  hit=ok&(u>=0)&(v>=0)&(u+v<=1)&(t>1e-7)&(t<maxd)
  return hit.any()
def inside(P,T,pt,tan,r,n=8):
  V=P[T];lo=V.min(1);hi=V.max(1);gap=np.maximum(0,np.maximum(lo-pt,pt-hi));near=np.linalg.norm(gap,axis=1)<max(4*r,0.006)
  Tn=T[near]
  if len(Tn)==0: return False
  a=np.array([0,1,0]) if abs(tan[1])<.9 else np.array([1,0,0]);u=np.cross(tan,a);u/=np.linalg.norm(u);v=np.cross(tan,u)
  for k in range(n):
    ang=2*np.pi*k/n;d=np.cos(ang)*u+np.sin(ang)*v
    if not ray_hits(P,Tn,pt,d,max(4*r,0.006)): return False
  return True
def lumen_report(P,T,pts,rad,off=0.5,seed=1):
  rng=np.random.default_rng(seed);tan=np.gradient(pts,axis=0);tan/=np.linalg.norm(tan,axis=1)[:,None]+1e-12
  res=[]
  for i in range(len(pts)):
    t=tan[i];a=np.array([0,1,0]) if abs(t[1])<.9 else np.array([1,0,0]);u=np.cross(t,a);u/=np.linalg.norm(u);v=np.cross(t,u)
    ang=rng.uniform(0,2*np.pi);p=pts[i]+off*rad[i]*(np.cos(ang)*u+np.sin(ang)*v)
    res.append(inside(P,T,p,t,rad[i]))
  return np.array(res)

CV='cardiovascular.'
def raw(i):return np.array(D[i]['P']).reshape(-1,3),np.array(D[i]['I']).reshape(-1,3)
def union(ids):
  Ps=[];Ts=[];o=0
  for i in ids:
    P,T=raw(i);Ps.append(P);Ts.append(T+o);o+=len(P)
  return np.vstack(Ps),np.vstack(Ts)
def first_hit(P,T,o,d,maxd):
  v0=P[T[:,0]];e1=P[T[:,1]]-v0;e2=P[T[:,2]]-v0
  h=np.cross(d,e2);a=(e1*h).sum(1);ok=np.abs(a)>1e-14;f=np.where(ok,1/np.where(ok,a,1),0)
  s=o-v0;u=f*(s*h).sum(1);q=np.cross(s,e1);v=f*(q*d).sum(1);t=f*(e2*q).sum(1)
  hit=ok&(u>=0)&(v>=0)&(u+v<=1)&(t>1e-6)&(t<maxd)
  return t[hit].min() if hit.any() else None
def bez(p0,p1,p2,p3,n=24):
  t=np.linspace(0,1,n)[:,None];return (1-t)**3*p0+3*(1-t)**2*t*p1+3*(1-t)*t**2*p2+t**3*p3
def cat(*arrs):
  out=[arrs[0]]
  for a in arrs[1:]:
    if np.linalg.norm(out[-1][-1]-a[0])<1e-6: a=a[1:]
    out.append(a)
  return np.vstack(out)
def line(a,b,step=0.002):
  n=max(2,int(np.linalg.norm(np.array(b)-np.array(a))/step)+1);t=np.linspace(0,1,n)[:,None];return np.array(a)*(1-t)+np.array(b)*t
segs={}
def put(sid,pts,rad,kind,o2,src,schem=False,role=None):
  pts=np.asarray(pts);rad=np.broadcast_to(np.asarray(rad,dtype=float),(len(pts),)).copy()
  segs[sid]=dict(kind=kind,o2=o2,source=src,schematic=schem,points=pts,radius=rad)

from scipy.interpolate import CubicSpline
CV='cardiovascular.'
RNG=np.random.default_rng(20261122)
def spline(pts,step=0.0015):
  pts=np.asarray(pts,float);d=np.r_[0,np.cumsum(np.linalg.norm(np.diff(pts,axis=0),axis=1))]
  cs=CubicSpline(d,pts,bc_type='natural');n=max(4,int(d[-1]/step)+1);s=np.linspace(0,d[-1],n);return cs(s)
def exit_pt(KP,O,d):
  """capsule 網格是有厚度、腎門處有開口的薄殼，射線法不可靠：改取『方向在 d 的錐角內、離 O 最遠』的網格頂點當皮質表面目標（錐角 22→65 度逐步放寬）。"""
  w=KP-O;L=np.linalg.norm(w,axis=1);c=(w@d)/L
  for cone in (22,35,50,65):
    m=c>np.cos(np.radians(cone))
    if m.any(): return KP[np.where(m)[0][np.argmax(L[m])]]
  return None
def unit(v):
  v=np.asarray(v,float);return v/np.linalg.norm(v)
# ---------------- mesh-derived centerlines ----------------
asc=tube_cl(CV+'ascending_aorta',[0.0195,1.3168,0.073],[0.0058,1.3606,0.0823])
arch=tube_cl(CV+'aortic_arch',[0.0058,1.3606,0.0823],[0.0193,1.3608,0.0204])
tho=tube_cl(CV+'thoracic_aorta',[0.0193,1.3608,0.0204],[0.0089,1.2082,0.0436])
abd=tube_cl(CV+'abdominal_aorta',[0.0089,1.2082,0.0436],[0.0054,1.0309,0.0852])
ivca=tube_cl(CV+'inferior_vena_cava_abdominal_part',[-0.0086,1.0316,0.0788],[-0.0095,1.1725,0.0682])
ivct=tube_cl(CV+'inferior_vena_cava_thoracic_part',[-0.0095,1.1725,0.0682],[-0.0146,1.2631,0.0756])
RA={ # side: (main artery loop a->b, ant branch tip, post branch tip, vein hilum loop, vein IVC loop)
 'L':dict(art=([0.0076,1.1169,0.0737],[0.0305,1.1159,0.06]),ant=([0.0305,1.1159,0.06],[0.0611,1.1279,0.0372]),post=([0.0305,1.1159,0.06],[0.0569,1.1159,0.0244]),
          vein=([0.0255,1.1107,0.053],[-0.0102,1.1042,0.079]),sx=1),
 'R':dict(art=([0.0072,1.1174,0.0687],[-0.0305,1.107,0.0582]),ant=([-0.0305,1.107,0.0582],[-0.0532,1.1115,0.0482]),post=([-0.0305,1.107,0.0582],[-0.0729,1.1012,0.0366]),
          vein=([-0.0275,1.0999,0.0516],[-0.0133,1.1032,0.0735]),sx=-1)}
T={'L':'left','R':'right'}
for s,r in RA.items():
  r['artT']=tube_cl(CV+T[s]+'_renal_artery',*r['art'])
  r['antT']=tube_cl(CV+'anterior_branch_of_renal_artery_'+s.lower(),*r['ant'])
  r['postT']=tube_cl(CV+'posterior_branch_of_renal_artery_'+s.lower(),*r['post'])
  r['veinT']=tube_cl(CV+T[s]+'_renal_vein',*r['vein'])
  print(s,'renal artery r(mm) start/end',round(r['artT'][1][0]*1000,2),round(r['artT'][1][-1]*1000,2),'vein r',round(r['veinT'][1][0]*1000,2),round(r['veinT'][1][-1]*1000,2))
# LV -> aorta (same generated link as the small-intestine scene)
lv_in=np.array([0.045,1.27,0.08]);lv_or=np.array([0.0121,1.3162,0.0779])
lvp=cat(bez(lv_in,lv_in+np.array([-0.004,0.012,0]),lv_or+np.array([0.008,-0.010,0]),lv_or,14),line(lv_or,asc[0][0]))
put('lv_out',lvp,np.linspace(0.012,0.012,len(lvp)),'chamber','rich','generated: left_ventricle interior -> aortic orifice loop',True)
ab_p,ab_r,_=abd
k_ren=int(np.argmin(np.abs(ab_p[:,1]-1.1169)))
ao=cat(asc[0],arch[0],tho[0],ab_p[:k_ren+1]);ao_r=np.r_[asc[1],arch[1][1:],tho[1][1:],ab_r[1:k_ren+1]][:len(ao)]
ao_r=np.interp(np.linspace(0,1,len(ao)),np.linspace(0,1,len(ao_r)),ao_r)
put('aorta',ao,ao_r,'artery','rich','mesh: ascending_aorta+aortic_arch+thoracic_aorta+abdominal_aorta (to the renal-artery origin height)')
put('aorta_lower',ab_p[k_ren:],ab_r[k_ren:],'artery','rich','mesh: abdominal_aorta (below the renal-artery origin)')
for s,r in RA.items():
  a_p,a_r,_=r['artT'];st=ab_p[k_ren]
  p=cat(line(st,a_p[0],0.0015),a_p);rr=np.r_[np.full(len(p)-len(a_p),a_r[0]),a_r]
  put('renal_a_'+s,p,rr,'artery','rich','mesh: %s_renal_artery main trunk (from aorta axis)'%T[s])
  put('renal_ant_'+s,r['antT'][0],r['antT'][1],'artery','rich','mesh: anterior_branch_of_renal_artery_'+s.lower())
  put('renal_post_'+s,r['postT'][0],r['postT'][1],'artery','rich','mesh: posterior_branch_of_renal_artery_'+s.lower())
ivc_all=cat(ivca[0],ivct[0]);ivc_r=np.r_[ivca[1],ivct[1][1:]][:len(ivc_all)]
kj=int(np.argmin(np.abs(ivc_all[:,1]-1.1035)))
for s,r in RA.items():
  v_p,v_r,_=r['veinT'];p=cat(v_p,line(v_p[-1],ivc_all[kj],0.0015));rr=np.r_[v_r,np.full(len(p)-len(v_p),v_r[-1])]
  put('renal_v_'+s,p,rr,'vein','poor','mesh: %s_renal_vein (hilum -> IVC axis)'%T[s])
put('ivc_low',ivc_all[:kj+1],ivc_r[:kj+1],'vein','poor','mesh: inferior_vena_cava_abdominal_part (below the renal-vein junction)')
iu=ivc_all[kj:];ra_or=np.array([-0.0127,1.2832,0.0839]);ra_in=np.array([-0.018,1.300,0.078])
up=cat(iu,bez(iu[-1],iu[-1]+(iu[-1]-iu[-4])/np.linalg.norm(iu[-1]-iu[-4])*0.008,ra_or-np.array([0,0.006,0]),ra_or,10),line(ra_or,ra_in))
put('ivc_upper',up,np.r_[ivc_r[kj:],np.full(len(up),0.011)][:len(up)],'vein','poor','mesh: inferior_vena_cava (above the renal-vein junction) + generated entry into right_atrium')
# ---------------- 繪製用半徑（腎動脈／分支／腎靜脈改畫成單層管，不再畫資料集的外殼） ----------------
# 資料集網格估出的半徑在接點處忽粗忽細（右腎動脈起點 6.3 mm、右腎靜脈近下腔靜脈 6.2 mm 是網格在大血管壁上變寬的假象）。
# 畫出來的半徑＝網格估計值「平滑＋單調化＋上限」：動脈由粗變細、靜脈由細變粗，不超過網格值，原值留在 radius_mesh。
def _ma(r,w=5):
  r=np.asarray(r,float);h=w//2;q=np.r_[np.full(h,r[0]),r,np.full(h,r[-1])];return np.convolve(q,np.ones(w)/w,mode='valid')
AR_MAX=0.0049; VN_MAX=0.0044
def srad(sid):
  r=_ma(segs[sid]['radius'])
  if sid.startswith('renal_a_'):
    r=np.minimum(np.minimum.accumulate(r),AR_MAX)
  elif sid.startswith('renal_ant_') or sid.startswith('renal_post_'):
    tr=srad('renal_a_'+sid[-1]);r=np.minimum(np.minimum.accumulate(r),tr[-1])
  elif sid.startswith('renal_v_'):
    r=np.minimum(np.maximum.accumulate(r),VN_MAX)
  return r
# ---------------- intrarenal schematic (generated) ----------------
# 規格（教學示意；腎內血管口徑資料集沒有，這裡的半徑是示意用的放大值）
# 半徑沿路漸變（由粗變細，靜脈側由細變粗）：接點兩端半徑相同，核心用圓頭管畫，接點圓滑、不會有平口斷面。
# 小動脈起點半徑＝上游腎動脈前／後支末端半徑，所以整條路徑是連續地由粗變細。
R_ART_END=0.00040; R_GLOM=(0.00040,0.00035); R_CAP=(0.00032,0.00027); R_VEN=(0.00048,0.0013)   # 小動脈起點半徑＝上游腎動脈分支（平滑後）末端半徑
def taper(n,a,b,pw=1.0):
  t=np.linspace(0,1,n)**pw;e=t*t*(3-2*t);return a+(b-a)*e
def taper_cap(n,a,b):   # 微血管：兩端略粗（接點）、中段最細
  t=np.linspace(0,1,n);return b+(a-b)*(1-np.sin(np.pi*t))
SPEC={'L':[('ant',1.0,0.5,3),('ant',0.0,0.35,3),('ant',-1.0,0.5,3),('post',0.8,-0.7,3),('post',-0.8,-0.7,3)],
      'R':[('post',0.8,-0.7,2),('post',-0.8,-0.7,2),('post',0.0,0.3,2)]}
from scipy.spatial import ConvexHull
HULL={s:ConvexHull(raw('visceral.fibrous_capsule_of_kidney_'+s.lower())[0]) for s in RA}
def in_hull(h,pts,margin=0.0005):
  return np.all(np.asarray(pts,float)@h.equations[:,:3].T+h.equations[:,3]<=-margin,axis=1)
def make_branch(s,k,O,d,H,nc,f,M,tv,rng):
  """f：腎小球位置占『腎門到皮質表面』的比例（越小越靠近腎門，用來保證整條路徑落在腎臟輪廓內）"""
  sc=f/0.92;ls=min(1.0,H/0.035)   # 短分支（靠近前後表面）把橫向偏移與腎絲球縮小
  ref=np.array([0,0,1.0]) if abs(d[2])<0.9 else np.array([1.0,0,0])
  t=unit(np.cross(d,ref))*(1 if k%2==0 else -1);b=unit(np.cross(d,t))
  P1=O+d*0.40*sc*H;P2=O+d*0.62*sc*H+t*0.006*ls;P3=O+d*0.86*sc*H+t*0.0065*ls;G=O+d*f*H+t*0.007*ls
  out={}
  out['kart']=spline([O,P1,P2,P3,G])
  n=60;ph=np.linspace(0,2*np.pi*2.2,n);rg=0.0014*ls;u=unit(np.cross(d,b));hel=[]
  for i,p_ in enumerate(ph):
    hel.append(G+d*(0.0010*p_/(2*np.pi))+rg*np.sin(np.pi*i/(n-1))*(np.cos(p_)*u+np.sin(p_)*b))
  out['kglom']=np.array(hel);E=out['kglom'][-1]
  V=O+d*0.76*sc*H-t*0.003;caps=[]
  for j in range(nc):
    a1=E+(-d*0.003+t*rng.uniform(-0.003,0.003)+b*rng.uniform(-0.004,0.004));a2=V+(d*0.003+t*rng.uniform(-0.003,0.003)+b*rng.uniform(-0.004,0.004))
    base=bez(E,a1,a2,V,30);off=0.0006*np.sin(np.linspace(0,np.pi*3,30)+j*2.1)[:,None]*(b[None,:] if j%2==0 else t[None,:])
    cap=base+off;cap[0]=E;cap[-1]=V;caps.append(spline(cap,0.001))
  out['kcap']=caps
  W2=O+d*0.58*sc*H-t*0.0025;W3=O+d*0.32*sc*H-t*0.0015
  out['kven']=cat(spline([V,W2,W3]),bez(W3,W3+(M-W3)*0.4,M-tv*0.008,M,22))
  return out,G
kinfo={}
for s,r in RA.items():
  KP,KT=raw('visceral.fibrous_capsule_of_kidney_'+s.lower())
  vp=r['veinT'][0];M=vp[0];tv=unit(vp[3]-vp[0])    # renal-vein start (hilum) and its flow direction
  for k,(tip,dy,dz,nc) in enumerate(SPEC[s]):
    O=(r['antT'][0] if tip=='ant' else r['postT'][0])[-1]
    d=unit([r['sx']*1.0,dy*0.9,dz*0.7]);S=exit_pt(KP,O,d);d=unit(S-O) if S is not None else d;H=float(np.linalg.norm(S-O)) if S is not None else 0.03
    for f in (0.90,0.82,0.74,0.66,0.58,0.50,0.42):
      br,G=make_branch(s,k,O,d,H,nc,f,M,tv,np.random.default_rng(1000+31*k+(7 if s=='R' else 0)))
      ka=br['kart'];far=np.r_[0,np.cumsum(np.linalg.norm(np.diff(ka,axis=0),axis=1))]>0.008   # 起點在腎門（腎囊凸包外），前 8 mm 不檢查
      pts=np.vstack([ka[far],br['kglom']]+br['kcap']+[br['kven'][:-22][::1][4:]])
      if in_hull(HULL[s],pts).all(): break
    else: print('WARNING branch not fully inside hull',s,k)
    ka0=float(srad(('renal_ant_' if tip=='ant' else 'renal_post_')+s)[-1]);ka1=min(ka0,R_ART_END);kg1=min(ka1,R_GLOM[1]);kc0=min(R_CAP[0],ka1*0.85)   # 每一處接點兩端半徑相同，且只會變細
    put(f'kart_{s}{k}',br['kart'],taper(len(br['kart']),ka0,ka1),'arteriole','rich','generated: schematic interlobar->arcuate->interlobular->afferent arteriole (kidney interior; diameters enlarged)',True)
    put(f'kglom_{s}{k}',br['kglom'],taper(len(br['kglom']),ka1,kg1),'capillary','rich>poor','generated: schematic glomerular tuft (enlarged ~7x; real ~0.2 mm)',True)
    for j,c in enumerate(br['kcap']):
      put(f'kcap_{s}{k}_{j}',c,taper_cap(len(c),kc0,min(R_CAP[1],kc0)),'capillary','rich>poor','generated: schematic efferent arteriole + peritubular capillary net (enlarged)',True)
    put(f'kven_{s}{k}',br['kven'],taper(len(br['kven']),*R_VEN,0.9),'vein','poor','generated: schematic interlobular->arcuate->interlobar vein, joining the renal vein at the hilum (enlarged)',True)
    kinfo[(s,k)]=dict(H=H,f=f)
    print('branch',s,k,tip,'H(mm)',round(H*1000,1),'f',f,'G',np.round(G,4))
# ---------------- validation ----------------
VAL={'lv_out':[CV+'left_ventricle',CV+'ascending_aorta',CV+'left_coronary_leaflet',CV+'right_coronary_leaflet',CV+'non_coronary_leaflet'],
 'aorta':[CV+'ascending_aorta',CV+'aortic_arch',CV+'thoracic_aorta',CV+'abdominal_aorta'],'aorta_lower':[CV+'abdominal_aorta'],
 'ivc_low':[CV+'inferior_vena_cava_abdominal_part',CV+'inferior_vena_cava_thoracic_part'],'ivc_upper':[CV+'inferior_vena_cava_abdominal_part',CV+'inferior_vena_cava_thoracic_part',CV+'right_atrium']}
for s in RA:
  l=s.lower();VAL['renal_a_'+s]=[CV+T[s]+'_renal_artery',CV+'abdominal_aorta'];VAL['renal_ant_'+s]=[CV+'anterior_branch_of_renal_artery_'+l];VAL['renal_post_'+s]=[CV+'posterior_branch_of_renal_artery_'+l]
  VAL['renal_v_'+s]=[CV+T[s]+'_renal_vein',CV+'inferior_vena_cava_abdominal_part']
report={}
for sid,ids in VAL.items():
  P,Tt=union(ids);sg=segs[sid];p=sg['points'];r=sg['radius']
  ok=lumen_report(P,Tt,p,r,0.5);report[sid]=dict(n=int(len(ok)),inside=int(ok.sum()),bad_index=[int(x) for x in np.where(~ok)[0]])
  print('VALID',sid,ok.mean().round(3),np.where(~ok)[0][:20])
for sid in list(segs):
  if sid[:4] in ('kart','kgl','kcap','kven'):
    s=sid.split('_')[1][0];p=segs[sid]['points']
    p=np.asarray(p,float)
    if sid.startswith('kven'): p=p[4:-22]   # 最後 22 點（匯入腎門的 Y 形接點）在腎外
    if sid.startswith('kart'): p=p[np.r_[0,np.cumsum(np.linalg.norm(np.diff(p,axis=0),axis=1))]>0.008]   # 起點在腎門，前 8 mm 在腎囊凸包外
    ok=in_hull(HULL[s],p)
    report[sid]=dict(n=int(len(ok)),inside=int(ok.sum()),bad_index=[int(x) for x in np.where(~ok)[0]],test='inside convex hull of the renal capsule mesh, 0.5 mm margin (excluded: the first 8 mm of kart, which start in the hilum, and the first 4 and last 22 points of kven, which end at the hilum)')
    if ok.mean()<1: print('KIDNEY-INSIDE',sid,ok.mean().round(3),np.where(~ok)[0][:12])
# 繪製半徑＋管的範圍：腎動脈從主動脈壁外開始畫、腎靜脈畫到下腔靜脈壁外（管口圓頭貼著大血管壁，血球仍沿完整中心線流）
def _cum(p):
  p=np.asarray(p,float);return np.r_[0,np.cumsum(np.linalg.norm(np.diff(p,axis=0),axis=1))]
for sid in list(segs):
  if sid.startswith(('renal_a_','renal_ant_','renal_post_','renal_v_')):
    segs[sid]['radius_mesh']=segs[sid]['radius'].copy();segs[sid]['radius']=srad(sid)
    c=_cum(segs[sid]['points']);Lm=c[-1]
    if sid.startswith('renal_a_'): segs[sid]['tubeRange']=[round(float(min(0.5,(0.0088+0.0030)/Lm)),4),1.0]    # 主動脈半徑 8.8 mm＋3 mm
    if sid.startswith('renal_v_'): segs[sid]['tubeRange']=[0.0,round(float(max(0.5,1-(0.0083+0.0022)/Lm)),4)]   # 下腔靜脈半徑 8.3 mm＋2.2 mm
out=dict(version='kidney_centerlines_v1',units='m',axes='+X body left, +Y up, +Z anterior (same as si_scene_v1.glb)',
 generator='tools/anatomy/build_kidney_centerlines.py',note='mesh: centerline and radius estimated from the glb mesh (level-set rings between open boundary loops, refined by plane slices); generated: schematic, not anatomical data (intrarenal vessels, glomerulus, capillary net, link into the right atrium).',
 validation=dict(method='mesh segments: 8 rays perpendicular to the path from a point offset 0.5 r from the centerline must hit the vessel mesh (union of listed nodes) within 4 r; kidney-interior routes: point inside the convex hull of the renal capsule mesh with 0.5 mm margin (the capsule is a thin shell open at the hilum, so ray tests are unreliable)',results=report),
 segments={k:dict(kind=v['kind'],o2=v['o2'],source=v['source'],schematic=v['schematic'],points=np.round(v['points'],5).tolist(),radius=np.round(v['radius'],5).tolist(),**({'radius_mesh':np.round(v['radius_mesh'],5).tolist()} if 'radius_mesh' in v else {}),**({'tubeRange':v['tubeRange']} if 'tubeRange' in v else {})) for k,v in segs.items()})
json.dump(out,open(sys.argv[2],'w'),separators=(',',':'))
print('wrote',sys.argv[2],len(segs))
