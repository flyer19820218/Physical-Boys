#!/usr/bin/env python3
"""build_lung_centerlines.py -- 「肺循環（小循環）」場景的血管中心線：從 si_scene_v1.glb 的網格估出肺動脈幹、左右肺動脈，並產生肺內的示意分支、肺泡與肺泡微血管網、肺靜脈。

用法（在 repo 根目錄）：
  node tools/anatomy/dump_glb_world.mjs assets/biology/anatomy3d/si_scene_v1.glb /tmp/si_world.json --modules /tmp/gl/node_modules
  python3 tools/anatomy/build_lung_centerlines.py /tmp/si_world.json assets/biology/anatomy3d/lung_centerlines_v1.json

方法函式（中心線估計、切面、射線檢查、depart／arrive／smooth_path／taper）原樣複製自 build_kidney_centerlines.py（不 import，因為那支是直接執行的腳本）。
接點畫法照 docs/ht3d_接力指南.md 第 5b 節：每段半徑陣列、切線相接（depart／arrive）、半徑連續＋Murray（母³＝Σ子³）、匯流逐一匯入、
同軸同半徑接點兩邊 capStart/capEnd=false、埋進大血管或心房壁的管口不封。

內容：
  * mesh 段（schematic=false）：肺動脈幹 pa_trunk、左肺動脈 pa_L、右肺動脈 pa_R（中心線與半徑由網格估出；資料集的肺動脈幹與左右肺動脈之間有約 2 cm 空隙，
    分叉處用 Bezier 補上，標在 source）；主動脈 aorta（升主動脈＋主動脈弓，給第 5 步「接大循環」）。
  * generated 段（schematic=true）：右心室→肺動脈瓣 rv_out、肺內動脈分支 a_<葉>（葉動脈）與 s_<床>（到肺泡床的小動脈，末段是沿肺泡排列的「小動脈脊」）、
    肺泡微血管 c_<床>_<k>（沿肺泡表面繞行，交叉成網）、小靜脈 v_<床>、肺靜脈 pv_LS/pv_LI/pv_RS/pv_RI（肺內段為示意，近端沿資料集肺靜脈網格走向，進左心房）、
    左心房→左心室 la_lv、左心室→主動脈 lv_out。
  * 肺泡（sacs）：每個肺泡床一排示意肺泡（球），口徑放大很多（真實直徑約 0.2 mm）。
  * 驗證：肺內 generated 點必須落在所屬肺葉網格的凸包內（內縮 0.5 mm；肺門處的葉動脈起點 12 mm、肺靜脈最後一段［出肺門到左心房］不檢查）；
    另做奇偶射線法（點在肺葉網格內）當補充；最小曲率半徑 ≥ 3 倍管半徑（肺動脈幹分叉處例外，見報告）。
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
def ss(x):
  x=np.clip(x,0,1);return x*x*(3-2*x)
def _cum(p):
  p=np.asarray(p,float);return np.r_[0,np.cumsum(np.linalg.norm(np.diff(p,axis=0),axis=1))]
def depart(P,T,ell):
  """路徑起點改成沿切線 T 離開，到弧長 ell 處才完全回到原本的走向（smoothstep 混合）"""
  P=np.asarray(P,float);c=_cum(P);T=unit(T);w=ss(c/ell)[:,None]
  Q=(1-w)*(P[0]+T[None,:]*c[:,None])+w*P;Q[0]=P[0]
  return spline(Q,float(np.mean(np.diff(c))))
def arrive(P,T,ell):
  """路徑終點改成沿切線 T 進入（depart 的鏡像）"""
  return depart(np.asarray(P,float)[::-1],-np.asarray(T,float),ell)[::-1]
def smooth_path(P,passes=4,ramp=0.004):
  """拉普拉斯平滑（兩端 ramp 公尺內逐漸不動，保住端點與切線）：把微血管的小轉折磨圓"""
  P=np.asarray(P,float).copy();c=_cum(P);w=(ss(c/ramp)*ss((c[-1]-c)/ramp))[:,None]
  for _ in range(passes):
    Q=P.copy();Q[1:-1]=P[1:-1]+0.5*w[1:-1]*(0.5*(P[:-2]+P[2:])-P[1:-1]);P=Q
  return P
def path_at(P,c,sv):
  i=int(np.clip(np.searchsorted(c,sv)-1,0,len(P)-2));f=(sv-c[i])/max(c[i+1]-c[i],1e-9);return P[i]*(1-f)+P[i+1]*f
def taper(n,a,b,pw=1.0):
  t=np.linspace(0,1,n)**pw;e=t*t*(3-2*t);return a+(b-a)*e
def taper_cap(n,a,b):   # 微血管：兩端略粗（接點）、中段最細
  t=np.linspace(0,1,n);return b+(a-b)*(1-np.sin(np.pi*t))
# ======================================================================================
# 肺循環（小循環）場景
# ======================================================================================
from scipy.spatial import ConvexHull
def ss(x):
  x=np.clip(x,0,1);return x*x*(3-2*x)
LOBES={'LU':'visceral.superior_lobe_of_left_lung','LL':'visceral.inferior_lobe_of_left_lung','RU':'visceral.superior_lobe_of_right_lung','RM':'visceral.middle_lobe_of_right_lung','RL':'visceral.inferior_lobe_of_right_lung'}
HULL={k:ConvexHull(raw(v)[0]) for k,v in LOBES.items()}
LMESH={k:raw(v) for k,v in LOBES.items()}
LTREE={k:cKDTree(mesh(v)[0]) for k,v in LOBES.items()}
def in_hull(h,pts,margin=0.0005):
  return np.all(np.asarray(pts,float)@h.equations[:,:3].T+h.equations[:,3]<=-margin,axis=1)
def ray_count(P,T,o,d):
  v0=P[T[:,0]];e1=P[T[:,1]]-v0;e2=P[T[:,2]]-v0
  h=np.cross(d,e2);a=(e1*h).sum(1);ok=np.abs(a)>1e-14;f=np.where(ok,1/np.where(ok,a,1),0)
  s=o-v0;u=f*(s*h).sum(1);q=np.cross(s,e1);v=f*(q*d).sum(1);t=f*(e2*q).sum(1)
  return int((ok&(u>=0)&(v>=0)&(u+v<=1)&(t>1e-7)).sum())
DIRS=[unit([0.31,0.87,0.38]),unit([-0.77,0.12,0.62]),unit([0.2,-0.5,-0.84])]
def in_mesh(k,p):   # 奇偶射線法（3 個方向多數決；肺葉網格有幾個小破洞，所以只當補充檢查）
  P,T=LMESH[k];return sum(ray_count(P,T,np.asarray(p,float),d)%2 for d in DIRS)>=2
def surf_d(k,p): return float(LTREE[k].query(p)[0])
def min_curv_ratio(p,r):
  """最小（曲率半徑 ÷ 管半徑）。曲率半徑＝點間距÷轉角"""
  p=np.asarray(p,float);a=p[1:-1]-p[:-2];b=p[2:]-p[1:-1];la=np.linalg.norm(a,axis=1);lb=np.linalg.norm(b,axis=1)
  c=np.clip((a*b).sum(1)/(la*lb+1e-15),-1,1);ang=np.arccos(c);R=0.5*(la+lb)/np.maximum(ang,1e-9)
  rr=np.asarray(r,float)[1:-1];q=R/rr;i=int(np.argmin(q));return float(q[i]),i
def tan_at(P,i,k=3):
  P=np.asarray(P,float);a=max(0,i-k);b=min(len(P)-1,i+k);return unit(P[b]-P[a])
def resamp(P,step):
  P=np.asarray(P,float);c=_cum(P);n=max(3,int(c[-1]/step)+1);s=np.linspace(0,c[-1],n);return np.stack([np.interp(s,c,P[:,q]) for q in range(3)],1)

# ---------------- mesh-derived centerlines ----------------
pt=tube_cl(CV+'pulmonary_trunk',[0.0287,1.3282,0.1013],[0.0295,1.345,0.0838])
plA=tube_cl(CV+'left_pulmonary_artery',[0.0339,1.347,0.0494],[0.0862,1.2691,0.0257])
prA=tube_cl(CV+'right_pulmonary_artery',[0.0098,1.3414,0.0552],[-0.0335,1.3313,0.0467])
asc=tube_cl(CV+'ascending_aorta',[0.0195,1.3168,0.073],[0.0058,1.3606,0.0823])
arch=tube_cl(CV+'aortic_arch',[0.0058,1.3606,0.0823],[0.0193,1.3608,0.0204])
rsv=tube_cl(CV+'right_superior_pulmonary_vein',[-0.0146,1.3105,0.0428],[-0.0443,1.3388,0.0554])

# 肺動脈幹：網格中心線＋到分叉點 B 的補段（資料集的肺動脈幹上端與左右肺動脈起點之間有約 2 cm 空隙）
tp,trr,_=pt
B=np.array([0.0282,1.3472,0.0640])
# 網格中心線在這條短而粗的管上有小鋸齒：改用 Hermite 曲線（起點＝肺動脈瓣環中心、沿網格下端切線；經網格上端環中心；到分叉點 B）
T0=unit(tp[3]-tp[0]);Tmid=unit(tp[-1]-tp[-4])
trunk_p=None
def _hp(pts,T0,T1,step=0.0012):
  pts=[np.asarray(p,float) for p in pts];T=[unit(T0)]+[unit(pts[i+1]-pts[i-1]) for i in range(1,len(pts)-1)]+[unit(T1)];out=[pts[0][None,:]]
  for i in range(len(pts)-1):
    a,b_=pts[i],pts[i+1];d=np.linalg.norm(b_-a);out.append(bez(a,a+T[i]*d*0.45,b_-T[i+1]*d*0.45,b_,max(6,int(d/step*2)))[1:])
  return resamp(np.vstack(out),step)
TB_end=unit(0.5*(unit(np.array([0.0339,1.347,0.0494])-B)+unit(np.array([0.0098,1.3414,0.0552])-B))+unit(B-tp[-1]))   # 分叉點切線：兩支起點方向的平均與來向的折衷
trunk_p=_hp([tp[0],B],T0,TB_end);TB=TB_end
# 半徑：網格估計值移動平均＋只會變細，接到分叉點約 13.5 mm（網格上端環 13.2 mm）
R_TR=13.6e-3
c=_cum(trunk_p);trunk_r=np.full(len(trunk_p),R_TR)-0.4e-3*ss(c/c[-1])
R_PA0=float(trunk_r[-1]*2**(-1/3))   # Murray：主幹³＝左³＋右³（兩支相同）
_w=ss((c-(c[-1]-0.016))/0.016);trunk_r=(1-_w)*trunk_r+_w*R_PA0   # Y 形分叉：主幹最後 16 mm 平滑收到子管起點半徑，左右肺動脈從分叉點同軸同半徑出發再分開（不會有台階或圓頭）
def pa_branch(meshcl,j0s):
  """分叉點 B 沿主幹切線 TB 離開，用 Hermite 曲線接上網格中心線第 j0 點（j0 在候選中取曲率最好者）"""
  mp,mr,_=meshcl;best=None
  for j0 in j0s:
    L0=mp[j0];TL=tan_at(mp,j0);g=_hp([B,L0],TB,TL)
    P=resamp(cat(g,mp[j0+1:]),0.0015);P=smooth_path(P,passes=8,ramp=0.004)
    c=_cum(P);cm=_cum(mp);rm=np.interp(np.clip(c-(c[-1]-(cm[-1]-cm[j0])),0,None)+cm[j0],cm,mr)
    q=min_curv_ratio(P,np.full(len(P),R_TR*2**(-1/3)))[0]
    if best is None or q>best[0]: best=(q,P,rm,j0)
  print('pa branch best j0',best[3],'q',round(best[0],2));return best[1],best[2]
def _ma(r,w=7):
  r=np.asarray(r,float);h=w//2;q=np.r_[np.full(h,r[0]),r,np.full(h,r[-1])];return np.convolve(q,np.ones(w)/w,mode='valid')
def pa_radius(P,rm,r0):
  c=_cum(P);r=_ma(rm);r=np.minimum(np.minimum.accumulate(r),r0);w=ss(c/0.012);return (1-w)*r0+w*r
paL_p,paL_rm=pa_branch(plA,range(1,14))
paR_p,paR_rm=pa_branch(prA,range(1,10))
paL_r=pa_radius(paL_p,paL_rm,R_PA0);paR_r=pa_radius(paR_p,paR_rm,R_PA0)

segs={}
def put(sid,pts,rad,kind,o2,src,schem=False,**kw):
  pts=np.asarray(pts,float);rad=np.broadcast_to(np.asarray(rad,dtype=float),(len(pts),)).copy()
  segs[sid]=dict(kind=kind,o2=o2,source=src,schematic=schem,points=pts,radius=rad,**kw)

# 右心室 → 肺動脈瓣（腔室內，不畫管，只給血球走）
rv_in=np.array([0.0215,1.2850,0.1120]);T0=unit(tp[1]-tp[0])
rvp=cat(bez(rv_in,rv_in+np.array([0.002,0.010,0.0]),tp[0]-T0*0.012,tp[0],16),tp[:1])
put('rv_out',rvp,0.012,'chamber','poor','generated: right_ventricle interior -> pulmonary valve (trunk lower loop)',True)
put('pa_trunk',trunk_p,trunk_r,'artery','poor','mesh: pulmonary_trunk (smooth Hermite through the mesh end loops) + generated 2 cm link to the bifurcation (the dataset leaves a gap between the trunk and the left/right pulmonary arteries)',False,
    radius_mesh=np.interp(np.linspace(0,1,len(trunk_p)),np.linspace(0,1,len(trr)),trr),capStart=False,capEnd=False)

# ---------------- 肺內分支：選肺泡床位置 ----------------
PREF={'LU':unit([0.85,0.35,0.30]),'LL':unit([0.85,-0.45,-0.1]),'RU':unit([-0.8,0.45,0.25]),'RM':unit([-0.75,-0.35,0.5]),'RL':unit([-0.85,-0.45,-0.05])}
def pick_sites(k,H,need,n=2,dmin=0.045,dmax=0.075,sep=0.028,first=None,avoid=0.022):
  P,_=LMESH[k];lo=P.min(0);hi=P.max(0);g=np.mgrid[lo[0]:hi[0]:0.004,lo[1]:hi[1]:0.004,lo[2]:hi[2]:0.004].reshape(3,-1).T
  g=g[in_hull(HULL[k],g,need)];d=np.linalg.norm(g-H,axis=1);g=g[(d>dmin)&(d<dmax)]
  g=np.array([p for p in g if surf_d(k,p)>need and in_mesh(k,p) and AVOID_TREE.query(p)[0]>avoid])
  sc=((g-H)/np.linalg.norm(g-H,axis=1)[:,None])@PREF[k]
  order=np.argsort(-sc);out=[] if first is None else [np.asarray(first)]
  for i in order:
    if all(np.linalg.norm(g[i]-q)>sep for q in out): out.append(g[i])
    if len(out)>=n: break
  return out

def arc_end(O,S,T,wr=0.6):
  """兩點間近似圓弧的終點切線：起點切線 T 對弦的鏡射（wr＝鏡射的比重；其餘取弦方向），讓轉彎平均分布在整段，曲率半徑最大"""
  ch=unit(np.asarray(S)-np.asarray(O));T=unit(T);rf=2*(T@ch)*ch-T;return unit(wr*rf+(1-wr)*ch)
def hermite_path(pts,T0,T1,step=0.0012,tens=0.5):
  """分段三次 Hermite：兩端切線固定為 T0／T1（切線相接），中間點的切線用 Catmull-Rom；切線長＝相鄰弦長×tens×2"""
  pts=[np.asarray(p,float) for p in pts];n=len(pts);T=[None]*n
  T[0]=unit(T0);T[-1]=unit(T1)
  for i in range(1,n-1): T[i]=unit(pts[i+1]-pts[i-1])
  out=[pts[0]]
  for i in range(n-1):
    a,b_=pts[i],pts[i+1];d=np.linalg.norm(b_-a);k=d*tens*1.0
    m=max(6,int(d/step*2))
    seg=bez(a,a+T[i]*k*0.9,b_-T[i+1]*k*0.9,b_,m)
    out.append(seg[1:])
  return resamp(np.vstack([out[0][None,:]]+out[1:]),step)
# ---------------- 肺泡床（示意）----------------
BEDS=[]   # dict(name, lobe, O, e1, n, ...)
def make_bed(name,lobe,O,e1,Ra,nalv,m,rc,ell,nref=None):
  e1=unit(e1)
  if nref is not None and np.linalg.norm(nref-(nref@e1)*e1)>1e-6: n=unit(nref-(nref@e1)*e1)
  else:
    ref=np.array([0,1.0,0]) if abs(e1[1])<0.9 else np.array([1.0,0,0]);n=unit(np.cross(e1,ref))
  b=unit(np.cross(e1,n))
  # 肺泡囊（照教科書／醫學插圖：一團擠在一起、大小不一的粉紅球，不是排成一列）：球心沿 e1 方向不等距、左右（±b）兩層交錯、上下（n）再各偏一點、半徑 0.8～1.25 Ra；
  # 小動脈脊在 +n 側、小靜脈脊在 −n 側，微血管從小動脈脊出發，沿「外側面」（各肺泡朝 ±b 的那一面）經緯交織成不規則的網，再匯入小靜脈脊。亂數種子＝床名，可重現。
  rg=np.random.RandomState(sum(ord(ch)*(i+7) for i,ch in enumerate(name))%100003)
  Ras=Ra*rg.uniform(0.8,1.25,nalv)
  gaps=np.array([(Ras[i]+Ras[i+1])*rg.uniform(0.42,0.62) for i in range(nalv-1)])
  xs=np.r_[0,np.cumsum(gaps)];xs=xs-xs.mean()
  lay=np.array([1 if (nalv-1-i)%2==0 else -1 for i in range(nalv)])   # 最後一個肺泡（追蹤的紅血球走的那個）朝 +b（鏡頭看得到的那一面）
  bo=lay*Ra*rg.uniform(0.80,1.05,nalv);no=Ra*rg.uniform(-0.45,0.45,nalv)
  C=[O+e1*x+n*ni+b*bi for x,ni,bi in zip(xs,no,bo)]
  hh=Ras+rc*1.5
  N=nalv*m+1;r0=rc*N**(1/3);hs=float(np.max(np.abs(no)+Ras))+r0+0.30*Ra;h=Ra+rc*1.5
  x0=xs[0]-Ras[0]-2.8*Ra;x1=xs[-1]+Ras[-1]+0.9*Ra
  def Ap(x): return O+n*hs+e1*x
  def Vp(x): return O-n*hs+e1*x
  caps=[];feeds=[];drains=[];rb=rc*m**(1/3)   # 每個肺泡一支小動脈分支（餵）與一支小靜脈分支（收）；rb＝Murray：m 條微血管半徑 rc 併成一條
  for i,(xi,Ci) in enumerate(zip(xs,C)):
    h=float(hh[i]);Oi=O+n*no[i]+b*bo[i];side=int(lay[i]);Rai=float(Ras[i])
    ph1=np.radians(rg.uniform(20,28));ph2=np.pi-ph1;Dx=max(1.45e-3,0.55*Ra);hoops=[]
    for k in range(m):
      # 微血管＝肺泡朝外那一面的「經線」：從上極（小動脈分支的末端）出發，往赤道散開、蜿蜒、傾斜，再在下極收攏（小靜脈分支的起點）。兩極共點 → 一條分支分成 m 條、再併回一條，像教科書那樣的網袋
      fr=(k+0.5)/m-0.5;dxc=Rai*1.35*fr;tilt=Rai*0.9*rg.uniform(-1,1)
      wg=0.17*h*rg.uniform(0.7,1.25)*(1 if rg.rand()<0.5 else -1);wf=2*np.pi*rg.uniform(0.9,1.35)/(ph2-ph1);wp=rg.uniform(0,2*np.pi)
      def hp(ph):
        sn=np.sin(np.pi*(ph-ph1)/(ph2-ph1));x=xi+(dxc+tilt*(ph-np.pi/2)/(ph2-ph1)+wg*np.sin(wf*(ph-ph1)+wp))*sn
        dxe=0.8*h*np.tanh((x-xi)/(0.8*h));rho=np.sqrt(h*h-dxe**2)
        return Oi+e1*x+(np.cos(ph)*n+np.sin(ph)*side*b)*rho
      phs=np.linspace(ph1,ph2,int((ph2-ph1)*h/0.0003)+2);hoops.append(np.array([hp(p) for p in phs]))
    Tt=hoops[0][0];Tb=hoops[0][-1]
    T1=unit(sum(unit(hh_[1]-hh_[0]) for hh_ in hoops));T2=unit(sum(unit(hh_[-1]-hh_[-2]) for hh_ in hoops))
    xa=float((Tt-O)@e1)-Dx;xb=float((Tb-O)@e1)-Dx
    A_=Ap(xa);V_=Vp(xb);d1=np.linalg.norm(Tt-A_);d2=np.linalg.norm(V_-Tb)
    fd=resamp(bez(A_,A_+e1*0.55*d1,Tt-T1*0.45*d1,Tt,30),0.0004);dr=resamp(bez(Tb,Tb+T2*0.45*d2,V_+e1*0.55*d2,V_,30),0.0004)
    feeds.append(dict(p=fd,xa=xa));drains.append(dict(p=dr,xb=xb))
    for hp_ in hoops: caps.append(dict(p=resamp(hp_,0.0004),xa=xa,xb=xb,alv=i))
  Ae=Ap(x1);Ve=Vp(x1);kk=0.55*np.linalg.norm(Ae-Ve);up=bez(Ae,Ae+e1*kk,Ve+e1*kk,Ve,40);up=resamp(up,0.0004)
  caps.append(dict(p=up,xa=x1,xb=x1,alv=-1,U=True))
  # 網：每個肺泡外側面再加三道「緯線」（極角約 40°／90°／140°，各自略微傾斜、蜿蜒），是開放的弧（只在朝外那半圈），與上面的「經線」交叉成多邊形網格（示意）；只畫管、不放血球
  rings=[]
  for i,Ci in enumerate(C):
    h=float(hh[i]);side=int(lay[i])
    for th0,o2v in ((np.radians(40),0.3),(np.radians(90),0.5),(np.radians(140),0.75)):
      span=np.radians(rg.uniform(78,100));al=np.linspace(-span,span,int(2*span*h*np.sin(th0)/0.0003)+2)
      tl=np.radians(rg.uniform(6,14))*np.sin(al*rg.uniform(1.0,1.6)+rg.uniform(0,6.28));th=np.clip(th0+tl,np.radians(28),np.radians(152))
      rp=Ci[None,:]+h*(np.cos(th)[:,None]*n[None,:]+np.sin(th)[:,None]*(np.cos(al)[:,None]*side*b[None,:]+np.sin(al)[:,None]*e1[None,:]))
      rings.append(dict(p=rp,o2=o2v,alv=i))
  return dict(feeds=feeds,drains=drains,rb=rb,name=name,lobe=lobe,O=O,e1=e1,n=n,b=b,Ra=Ra,Ras=Ras,rc=rc,r0=r0,hs=hs,x0=x0,x1=x1,xs=xs,C=C,caps=caps,rings=rings,Ap=Ap,Vp=Vp,N=N,ell=ell)

from scipy.spatial import SphericalVoronoi
def make_bed_net(name,lobe,O,e1,Ra,nalv,m,rc,ell,nref=None):
  """放大的肺泡床（FOCUS）專用：一團大小不一的肺泡，每個肺泡朝外那一面是『球面 Voronoi 多邊形網』的微血管網（教科書／醫學插圖那種不規則 5～6 邊形網袋）。
  網的接點（Voronoi 頂點）在球面上，邊是弧；上、下兩極各接一條小動脈分支（feeds）與小靜脈分支（drains）；
  每個肺泡挑 m 條『最短路徑』當有血流的微血管（c_，沿網的邊走、平滑），其餘的邊只畫管（n_，漸變血色）。亂數種子＝床名，可重現。"""
  e1=unit(e1)
  if nref is not None and np.linalg.norm(nref-(nref@e1)*e1)>1e-6: n=unit(nref-(nref@e1)*e1)
  else:
    ref=np.array([0,1.0,0]) if abs(e1[1])<0.9 else np.array([1.0,0,0]);n=unit(np.cross(e1,ref))
  b=unit(np.cross(e1,n))
  rg=np.random.RandomState(sum(ord(ch)*(i+7) for i,ch in enumerate(name))%100003)
  Ras=Ra*rg.uniform(0.8,1.25,nalv)
  gaps=np.array([(Ras[i]+Ras[i+1])*rg.uniform(0.42,0.62) for i in range(nalv-1)])
  xs=np.r_[0,np.cumsum(gaps)];xs=xs-xs.mean()
  lay=np.array([1 if (nalv-1-i)%2==0 else -1 for i in range(nalv)])
  bo=lay*Ra*rg.uniform(0.80,1.05,nalv);no=Ra*rg.uniform(-0.45,0.45,nalv)
  C=[O+e1*x+n*ni+b*bi for x,ni,bi in zip(xs,no,bo)]
  hh=Ras+rc*1.1
  N=nalv*m+1;r0=rc*N**(1/3);hs=float(np.max(np.abs(no)+Ras))+r0+0.30*Ra;rb=rc*m**(1/3)
  x0=xs[0]-Ras[0]-2.8*Ra;x1=xs[-1]+Ras[-1]+0.9*Ra;Dx=max(1.45e-3,0.55*Ra)
  def Ap(x): return O+n*hs+e1*x
  def Vp(x): return O-n*hs+e1*x
  caps=[];rings=[];feeds=[];drains=[]
  def slerp_pts(c,h,u,v,step=0.0004):
    ang=float(np.arccos(np.clip(u@v,-1,1)));k=max(2,int(ang*h/step)+1);t=np.linspace(0,1,k)
    so=np.sin(ang)+1e-12;return np.array([c+h*(np.sin((1-a)*ang)/so*u+np.sin(a*ang)/so*v) for a in t])
  for i,(xi,Ci) in enumerate(zip(xs,C)):
    h=float(hh[i]);side=int(lay[i]);Rai=float(Ras[i]);sb=side*b
    # 球面上的亂點（Fibonacci 螺旋＋抖動）→ 球面 Voronoi → 多邊形網
    cell=0.40*Rai;P=int(4*np.pi*Rai**2/(0.87*cell**2));gi=np.arange(P)+0.5
    zz=1-2*gi/P;phi=np.pi*(1+5**0.5)*gi;rr_=np.sqrt(1-zz**2);U=np.stack([rr_*np.cos(phi),rr_*np.sin(phi),zz],1)
    U=U+rg.normal(0,0.22*cell/Rai,U.shape);U/=np.linalg.norm(U,axis=1)[:,None]
    sv=SphericalVoronoi(U,1.0,np.zeros(3));sv.sort_vertices_of_regions();V=sv.vertices
    # 局部座標：n（上，小動脈側）、sb（朝外）、e1
    VW=V[:,0:1]*n[None,:]+V[:,1:2]*sb[None,:]+V[:,2:3]*e1[None,:]   # 任意旋轉都可以：把單位球的 xyz 對到 n/sb/e1
    other=[(j,C[j],float(Ras[j])) for j in range(nalv) if j!=i]
    def ok(pt):
      if (pt-Ci)@sb<-0.10*h:return False
      for j,Cj,Rj in other:
        if np.linalg.norm(pt-Cj)<Rj+0.5*rc:return False
      return True
    okv=np.array([ok(Ci+h*w) for w in VW])
    E=set()
    for reg in sv.regions:
      for a_,b_ in zip(reg,reg[1:]+reg[:1]):
        if okv[a_] and okv[b_]:E.add((min(a_,b_),max(a_,b_)))
    E=sorted(E)
    # 最大連通塊
    import collections
    adj=collections.defaultdict(list)
    for a_,b_ in E:adj[a_].append(b_);adj[b_].append(a_)
    seen={};comps=[]
    for v0 in adj:
      if v0 in seen:continue
      st=[v0];seen[v0]=len(comps);cmp=[v0]
      while st:
        x_=st.pop()
        for y_ in adj[x_]:
          if y_ not in seen:seen[y_]=len(comps);st.append(y_);cmp.append(y_)
      comps.append(cmp)
    big_=max(comps,key=len);bigs=set(big_);E=[e for e in E if e[0] in bigs]
    # 兩極：上極（+n）／下極（−n）略偏向朝外
    ph1=np.radians(rg.uniform(22,30))
    Tt=Ci+h*(np.cos(ph1)*n+np.sin(ph1)*sb);Tb=Ci+h*(-np.cos(ph1)*n+np.sin(ph1)*sb)
    P3=Ci[None,:]+h*VW
    vt=min(big_,key=lambda v:np.linalg.norm(P3[v]-Tt));vb=min(big_,key=lambda v:np.linalg.norm(P3[v]-Tb))
    # 最短路徑（Dijkstra）取 m 條，逐條把已用過的邊加重
    wgt={e:float(np.linalg.norm(P3[e[0]]-P3[e[1]])) for e in E};used=set();paths=[]
    import heapq
    for t_ in range(m):
      dist={vt:0.0};prev={};pq=[(0.0,vt)]
      while pq:
        d_,x_=heapq.heappop(pq)
        if d_>dist.get(x_,1e9):continue
        if x_==vb:break
        for y_ in adj[x_]:
          e=(min(x_,y_),max(x_,y_))
          if e not in wgt:continue
          nd=d_+wgt[e]*(1+3.0*(e in used))*rg.uniform(0.9,1.15)
          if nd<dist.get(y_,1e9):dist[y_]=nd;prev[y_]=x_;heapq.heappush(pq,(nd,y_))
      if vb not in dist:break
      pth=[vb]
      while pth[-1]!=vt:pth.append(prev[pth[-1]])
      pth=pth[::-1]
      if pth in paths:continue
      paths.append(pth);used|={(min(a_,b_),max(a_,b_)) for a_,b_ in zip(pth,pth[1:])}
    # c_：沿路徑、平滑、再投回球面
    for pth in paths:
      pts=np.vstack([Tt[None,:]]+[P3[v][None,:] for v in pth]+[Tb[None,:]])
      sp_=spline(pts,0.0004);sp_[0]=Tt;sp_[-1]=Tb
      d_=sp_-Ci;sp_=Ci+d_/np.linalg.norm(d_,axis=1)[:,None]*h
      sp_[0]=Tt;sp_[-1]=Tb
      caps.append(dict(p=sp_,alv=i))
    # n_：其餘的邊，漸變血色（上極 0.15 缺氧 → 下極 0.85 充氧），兩端各延長一點讓接點相連
    ox=lambda w:float(np.clip(0.5-0.5*(w@n)/1.0,0.0,1.0))
    for (a_,b_) in E:
      if (a_,b_) in used:continue
      u=VW[a_];v=VW[b_];arc=slerp_pts(Ci,h,u,v);tA=unit(arc[0]-arc[1]);tB=unit(arc[-1]-arc[-2])
      arc=np.vstack([arc[0]+tA*1.0*rc,arc,arc[-1]+tB*1.0*rc]);arc=resamp(arc,0.0004)
      rings.append(dict(p=arc,o2=[round(0.15+0.7*ox(u),3),round(0.15+0.7*ox(v),3)],alv=i))
    # 分支：小動脈脊 → 上極；下極 → 小靜脈脊
    T1=unit(P3[vt]-Tt)*0+unit(Tt-(Ci+h*n)+1e-9*e1)*0;
    dirt=-unit(np.cross(np.cross(Tt-Ci,n),Tt-Ci)) if abs(unit(Tt-Ci)@n)<0.999 else e1   # 沿球面朝赤道的方向（切線）
    dirb=-unit(np.cross(np.cross(Tb-Ci,n),Tb-Ci)) if abs(unit(Tb-Ci)@n)<0.999 else e1
    xa=float((Tt-O)@e1)-Dx;xb=float((Tb-O)@e1)-Dx;A_=Ap(xa);V_=Vp(xb);d1=np.linalg.norm(Tt-A_);d2=np.linalg.norm(V_-Tb)
    fd=resamp(bez(A_,A_+e1*0.55*d1,Tt-dirt*0.45*d1,Tt,30),0.0004);dr=resamp(bez(Tb,Tb+dirb*0.45*d2,V_+e1*0.55*d2,V_,30),0.0004)
    feeds.append(dict(p=fd,xa=xa));drains.append(dict(p=dr,xb=xb))
    for cp in caps:
      if cp['alv']==i:cp['xa']=xa;cp['xb']=xb
  Ae=Ap(x1);Ve=Vp(x1);kk=0.55*np.linalg.norm(Ae-Ve);up=bez(Ae,Ae+e1*kk,Ve+e1*kk,Ve,40);up=resamp(up,0.0004)
  caps.append(dict(p=up,xa=x1,xb=x1,alv=-1,U=True))
  return dict(feeds=feeds,drains=drains,rb=rb,name=name,lobe=lobe,O=O,e1=e1,n=n,b=b,Ra=Ra,Ras=Ras,rc=rc,r0=r0,hs=hs,x0=x0,x1=x1,xs=xs,C=C,caps=caps,rings=rings,Ap=Ap,Vp=Vp,N=N,ell=ell)

import heapq,collections
def chaikin_keep(P,it=3):
  """Chaikin 切角（保留兩端點）：血管在網的接點轉彎不要太尖"""
  P=np.asarray(P,float)
  for _ in range(it):
    if len(P)<3:break
    Q=[P[0]]
    for a,b_ in zip(P[:-1],P[1:]):Q+=[0.75*a+0.25*b_,0.25*a+0.75*b_]
    Q.append(P[-1]);P=np.array(Q)
  return P
def make_bed_clump(name,lobe,O,e1,Ra,nalv,m,rc,ell,nref=None):
  """放大的肺泡床（FOCUS）：一團圓圓的肺泡（教科書／醫學插圖那種葡萄串）。
  ① 球形堆疊：nalv 個大小不一的球擠在一起（互相只重疊一點）。② 每個球露在外面的那一面是球面 Voronoi 多邊形網（微血管網，球與球接縫處接起來成一張大網）。
  ③ 小動脈樹／小靜脈樹：從朝向肺門的兩個根（一上一下）沿著網的邊貼著肺泡表面分叉，每個肺泡一片網各有一個『入口』（小動脈末端）和一個『出口』（小靜脈起點）；管徑 Murray（r³＝子管 r³ 之和，葉＝m 條微血管）。
  ④ 每個肺泡 m 條最短路徑當有血流的微血管（c_），其餘的邊只畫管（n_，血色由小動脈側缺氧漸變到小靜脈側充氧）。亂數種子＝床名，可重現。"""
  e1=unit(e1)
  if nref is not None and np.linalg.norm(nref-(nref@e1)*e1)>1e-6: n=unit(nref-(nref@e1)*e1)
  else:
    ref=np.array([0,1.0,0]) if abs(e1[1])<0.9 else np.array([1.0,0,0]);n=unit(np.cross(e1,ref))
  b=unit(np.cross(e1,n))
  rg=np.random.RandomState(sum(ord(ch)*(i+7) for i,ch in enumerate(name))%100003)
  Ras=Ra*rg.uniform(0.8,1.22,nalv)
  # 1. 球形堆疊（鬆弛法：重疊就推開、整體往中心拉）
  X=rg.normal(0,1,(nalv,3));X=X/np.linalg.norm(X,axis=1)[:,None]*(Ra*1.3*nalv**(1/3))*rg.uniform(0.3,1.0,(nalv,1))
  for it in range(600):
    G=X.mean(0);F=-0.02*(X-G)
    for i in range(nalv):
      for j in range(i+1,nalv):
        d=X[i]-X[j];L=np.linalg.norm(d)+1e-9;want=(Ras[i]+Ras[j])*0.93
        if L<want:f=d/L*(want-L)*0.5;F[i]+=f;F[j]-=f
    X=X+F
  X=X-X.mean(0)
  C=[O+e1*x[0]+n*x[1]+b*x[2] for x in X];Rcl=float(np.max(np.linalg.norm(X,axis=1)+Ras))
  hh=Ras+rc*1.1;cell=0.44*Ra
  # 2. 每個球的露出面：球面 Voronoi 的邊
  nodes=[];nid={};E_by=[];adjG=collections.defaultdict(list);Ew={}
  def addn(i,v,pt):
    nid[(i,v)]=len(nodes);nodes.append(dict(i=i,pt=pt))
  for i,Ci in enumerate(C):
    h=float(hh[i]);Rai=float(Ras[i]);P=int(4*np.pi*Rai**2/(0.87*cell**2));gi=np.arange(P)+0.5
    zz=1-2*gi/P;phi=np.pi*(1+5**0.5)*gi;rr_=np.sqrt(1-zz**2);U=np.stack([rr_*np.cos(phi),rr_*np.sin(phi),zz],1)
    U=U+rg.normal(0,0.22*cell/Rai,U.shape);U/=np.linalg.norm(U,axis=1)[:,None]
    sv=SphericalVoronoi(U,1.0,np.zeros(3));sv.sort_vertices_of_regions();V=sv.vertices
    VW=V[:,0:1]*n[None,:]+V[:,1:2]*b[None,:]+V[:,2:3]*e1[None,:]
    other=[(j,C[j],float(Ras[j])) for j in range(nalv) if j!=i]
    def ok(pt):
      for j,Cj,Rj in other:
        if np.linalg.norm(pt-Cj)<Rj+0.6*rc:return False
      return True
    okv=np.array([ok(Ci+h*w) for w in VW]);E=set()
    for reg in sv.regions:
      for a_,b_ in zip(reg,reg[1:]+reg[:1]):
        if okv[a_] and okv[b_]:E.add((min(a_,b_),max(a_,b_)))
    adj=collections.defaultdict(list)
    for a_,b_ in E:adj[a_].append(b_);adj[b_].append(a_)
    seen=set();best=[]
    for v0 in adj:
      if v0 in seen:continue
      st=[v0];seen.add(v0);cmp=[v0]
      while st:
        x_=st.pop()
        for y_ in adj[x_]:
          if y_ not in seen:seen.add(y_);st.append(y_);cmp.append(y_)
      if len(cmp)>len(best):best=cmp
    keep=set(best)
    for v in keep:addn(i,v,Ci+h*VW[v])
    for (a_,b_) in E:
      if a_ in keep:
        na,nb=nid[(i,a_)],nid[(i,b_)];Ew[(min(na,nb),max(na,nb))]=float(np.linalg.norm(nodes[na]['pt']-nodes[nb]['pt']));
        adjG[na].append(nb);adjG[nb].append(na)
  # 球與球之間的接縫：不同肺泡、距離近的接點互連（讓一張網連成一片，血管才走得過去）
  PT=np.array([nd['pt'] for nd in nodes]);tree=cKDTree(PT)
  for a_,b_ in tree.query_pairs(1.15*cell):
    if nodes[a_]['i']!=nodes[b_]['i']:
      Ew[(min(a_,b_),max(a_,b_))]=float(np.linalg.norm(PT[a_]-PT[b_]));adjG[a_].append(b_);adjG[b_].append(a_)
  def dijk(src,banned=None,pen=None):
    dist={src:0.0};prev={};pq=[(0.0,src)]
    while pq:
      d_,x_=heapq.heappop(pq)
      if d_>dist.get(x_,1e9):continue
      for y_ in adjG[x_]:
        e=(min(x_,y_),max(x_,y_))
        if banned and e in banned:continue
        w=Ew[e]*(1+(pen.get(e,0) if pen else 0))*rg.uniform(0.95,1.1)
        if d_+w<dist.get(y_,1e9):dist[y_]=d_+w;prev[y_]=x_;heapq.heappush(pq,(d_+w,y_))
    return dist,prev
  def pathto(prev,t):
    p=[t]
    while p[-1] in prev:p.append(prev[p[-1]])
    return p[::-1]
  # 3. 兩個根：朝向肺門（−e1）的上方（動脈）與下方（靜脈）
  sc_a=PT@(e1*1.0-n*0.7)*-1;sc_a=-(PT@e1)+0.7*(PT@n)   # 越小越好：偏 −e1、偏 +n
  rootA=int(np.argmin(0.6*(PT@e1)-0.7*(PT@n)-0.9*(PT@b)))
  rootV=int(np.argmin(0.6*(PT@e1)+0.7*(PT@n)-0.9*(PT@b)))
  dA,pA=dijk(rootA)
  reach=set(dA)
  if rootV not in reach:rootV=min(reach,key=lambda v:np.linalg.norm(PT[v]-PT[rootV]))
  alvs=[i for i in range(nalv) if any(nodes[v]['i']==i for v in reach)]
  # 每個肺泡的小動脈入口：離動脈根最近（圖上距離）的接點
  aleaf={i:min((v for v in reach if nodes[v]['i']==i),key=lambda v:dA[v]) for i in alvs}
  # 小動脈樹的邊
  aedges=set()
  for i,lf in aleaf.items():
    pp=pathto(pA,lf);aedges|={(min(x,y),max(x,y)) for x,y in zip(pp,pp[1:])}
  # 小靜脈樹：避開小動脈樹的邊（走另一些邊），每個肺泡的出口＝離靜脈根近、且離入口夠遠的接點
  dV,pV=dijk(rootV,banned=aedges)
  if len(dV)<0.8*len(reach):dV,pV=dijk(rootV,pen={e:6.0 for e in aedges})
  vleaf={}
  for i in alvs:
    cand=[v for v in dV if nodes[v]['i']==i and np.linalg.norm(PT[v]-PT[aleaf[i]])>1.1*float(Ras[i])]
    if not cand:cand=[v for v in dV if nodes[v]['i']==i]
    if cand:vleaf[i]=min(cand,key=lambda v:dV[v]-0.3*np.linalg.norm(PT[v]-PT[aleaf[i]]))
  alvs=[i for i in alvs if i in vleaf]
  vedges=set()
  for i in alvs:
    pp=pathto(pV,vleaf[i]);vedges|={(min(x,y),max(x,y)) for x,y in zip(pp,pp[1:])}
  # 4. 樹 → 區段（在分岔點切開）；半徑 Murray：葉＝m 條微血管
  def tree_chains(root,prevmap,leaves,rev):
    ch=collections.defaultdict(list);paths_={}
    for i in alvs:
      pp=pathto(prevmap,leaves[i]);paths_[i]=pp
      for x,y in zip(pp,pp[1:]):ch[x].append(y)
    kids={x:sorted(set(v)) for x,v in ch.items()};leafset={leaves[i] for i in alvs}
    w={}
    def W(x):
      if x in w:return w[x]
      w[x]=(m if x in leafset else 0)+sum(W(y) for y in kids.get(x,[]));return w[x]
    W(root);out=[];idof={}
    def walk(x):
      for y in kids.get(x,[]):
        chain=[x,y]
        while len(kids.get(y,[]))==1 and y not in leafset:
          y=kids[y][0];chain.append(y)
        cid=len(out);out.append(dict(nodes=chain,r=1.35*rc*W(chain[-1])**(1/3)));idof[(chain[0],chain[-1])]=cid
        walk(chain[-1])
    walk(root);return out,idof,paths_
  ach,aid,apaths=tree_chains(rootA,pA,aleaf,False)
  vch,vid,vpaths=tree_chains(rootV,pV,vleaf,True)
  def chain_pts(nodes_):
    Q=np.array(PT[nodes_],float)
    for _ in range(4):   # 拉普拉斯平滑（兩端固定），把樹的急彎放緩
      if len(Q)>2:Q[1:-1]=0.5*Q[1:-1]+0.25*(Q[:-2]+Q[2:])
    return chaikin_keep(Q,3)
  arts=[dict(p=resamp(chain_pts(c['nodes']),0.0004),r=c['r'],nodes=c['nodes']) for c in ach]
  vens=[dict(p=resamp(chain_pts(c['nodes'][::-1]),0.0004),r=c['r'],nodes=c['nodes']) for c in vch]   # 小靜脈：血往根流，所以反向
  # 5. 微血管：每個肺泡 m 條最短路徑（避開兩棵樹）
  caps=[];used=set();treeE=aedges|vedges;rings=[]
  for i in alvs:
    a,v=aleaf[i],vleaf[i];pen={};paths=[]
    for t_ in range(m):
      adjL={}
      dist={a:0.0};prev={};pq=[(0.0,a)]
      while pq:
        d_,x_=heapq.heappop(pq)
        if d_>dist.get(x_,1e9):continue
        if x_==v:break
        for y_ in adjG[x_]:
          if nodes[y_]['i']!=i:continue
          e=(min(x_,y_),max(x_,y_))
          if e in treeE:continue
          nd=d_+Ew[e]*(1+3.0*pen.get(e,0))*rg.uniform(0.9,1.15)
          if nd<dist.get(y_,1e9):dist[y_]=nd;prev[y_]=x_;heapq.heappush(pq,(nd,y_))
      if v not in dist:break
      pth=pathto(prev,v)
      if pth in paths:continue
      paths.append(pth)
      for x,y in zip(pth,pth[1:]):pen[(min(x,y),max(x,y))]=1
    if not paths:continue
    for pth in paths:
      sp_=spline(PT[pth],0.0004);sp_[0]=PT[a];sp_[-1]=PT[v]
      Ci=C[i];h=float(hh[i]);d_=sp_-Ci;sp_=Ci+d_/np.linalg.norm(d_,axis=1)[:,None]*h;sp_[0]=PT[a];sp_[-1]=PT[v]
      caps.append(dict(p=sp_,alv=i))
      used|={(min(x,y),max(x,y)) for x,y in zip(pth,pth[1:])}
  # 6. 其餘的邊：只畫管，血色依「離小動脈根 / 小靜脈根」的比例漸變
  def o2n(v):
    da=dA.get(v,0.0);dv=dV.get(v,da);return round(float(0.15+0.7*da/(da+dv+1e-9)),3)
  for (x,y),wl in Ew.items():
    if (x,y) in treeE or (x,y) in used or x not in dA or y not in dA:continue
    if nodes[x]['i']!=nodes[y]['i']:continue
    a0,b0=PT[x],PT[y];ct=C[nodes[x]['i']];t=np.linspace(0,1,max(2,int(wl/0.0004)+1))[:,None];arc=(1-t)*a0+t*b0
    d_=arc-ct;arc=ct+d_/np.linalg.norm(d_,axis=1)[:,None]*float(hh[nodes[x]['i']])
    tA=unit(arc[0]-arc[1]);tB=unit(arc[-1]-arc[-2]);arc=np.vstack([arc[0]+tA*1.0*rc,arc,arc[-1]+tB*1.0*rc]);arc=resamp(arc,0.0004)
    rings.append(dict(p=arc,o2=[o2n(x),o2n(y)],alv=nodes[x]['i']))
  # 7. 追蹤的紅血球：選朝 +b（鏡頭那一面）最外面的肺泡，走 小動脈樹的路徑 → 微血管 → 小靜脈樹的路徑
  TK=max([i for i in alvs if len(apaths[i])>4 and len(vpaths[i])>4] or alvs,key=lambda i:(C[i]-O)@b)
  def chain_ids(idmap,pp):
    ids=[];cur=pp[0];k=0
    # 沿路徑逐段找「以 cur 開頭」的區段，再走到它的末端
    pos=0
    while pos<len(pp)-1:
      for (x,y),cid in idmap.items():
        if x==pp[pos] and y in pp[pos+1:]:
          ids.append(cid);pos=pp.index(y);break
      else:break
    return ids
  aids=chain_ids(aid,apaths[TK]);vids=chain_ids(vid,vpaths[TK][::-1][::-1])
  vp_=vpaths[TK]   # 根 → 葉；靜脈血流方向是 葉 → 根，所以要反過來走區段
  vids=list(reversed(chain_ids(vid,vp_)))
  capid=sum(1 for cp_ in caps if cp_['alv']<TK)
  r_root=ach[0]['r'];t_a=unit(arts[0]['p'][min(4,len(arts[0]['p'])-1)]-arts[0]['p'][0]);t_v=unit(vens[0]['p'][-1]-vens[0]['p'][-4]) if False else None
  # 靜脈根：血在根接上 v_ 路徑；根處各區段的末端方向
  vroot_ends=[v_ for v_ in vens if v_['nodes'][0]==rootV]
  t_v=unit(sum(unit(v_['p'][-1]-v_['p'][-min(4,len(v_['p']))]) for v_ in vroot_ends))
  return dict(arts=arts,vens=vens,rootA=PT[rootA],rootV=PT[rootV],atan=t_a,vtan=t_v,r_root=r_root,r_rootV=max(v_['r'] for v_ in vroot_ends),
    tracer=dict(art=[f'sb_ID_{c}' for c in aids],cap=capid,ven=[f'vb_ID_{c}' for c in vids],alv=int(TK)),
    name=name,lobe=lobe,O=O,e1=e1,n=n,b=b,Ra=Ra,Ras=Ras,rc=rc,r0=r_root,Rcl=Rcl,C=C,caps=caps,rings=rings,N=len(alvs)*m,ell=ell,clump=True)

def spine_radius(xs_sorted_events,xq,rc,N,ramp):
  """沿脊的 x 座標，依『還剩幾條微血管沒分出去』用 Murray 算半徑（每個分出點用 smoothstep 過渡 ramp 公尺）"""
  cnt=N-sum(ss((xq-xe+ramp/2)/ramp) for xe in xs_sorted_events)
  return rc*np.maximum(cnt,1)**(1/3)

# ---------------- 樹：葉動脈 → 兩條小動脈 → 肺泡床；小靜脈 → 肺靜脈 ----------------
def side_branch(parentP,parentR,s_b,r_c,target_pts,ell=0.012):
  """從母管中段 s_b（弧長）分出一條子管：沿母管切線離開；起點從母管中心往分支那一側移 (r母−r子)，子管外緣貼著母管內壁，
  開口環貼在母管壁上（不會在母管中央看到一個環或圓頭）；母管在分出點之後依 Murray 變細"""
  c=_cum(parentP);O=path_at(parentP,c,s_b);T=unit(path_at(parentP,c,s_b+0.003)-path_at(parentP,c,s_b-0.003))
  tg=np.asarray(target_pts[-1]);w_=tg-O;perp=unit(w_-(w_@T)*T);rp=float(np.interp(s_b,c,parentR))
  O2=O+perp*max(0.0,rp-r_c)*0.85;P=hermite_path([O2,tg],T,arc_end(O2,tg,T))
  ra=(rp**3-r_c**3)**(1/3)
  w=ss((c-s_b+0.004)/0.008);newR=np.minimum(parentR,(1-w)*parentR+w*np.minimum(parentR,ra*parentR/np.maximum(rp,1e-9)))
  return P,newR
def y_children(P,R,targets_list,ell=0.010):
  """母管末端 Y 形分成兩支：兩支都從末端沿末端切線離開（depart），起點半徑＝母管末端半徑÷2^(1/3)"""
  O=P[-1];T=unit(P[-1]-P[-4]);out=[]
  for tg in targets_list: out.append(depart(spline([O]+list(tg),0.0012),T,ell))
  return out,float(R[-1]*2**(-1/3))

SPEC={'LU':dict(n=2),'LL':dict(n=2),'RU':dict(n=2),'RM':dict(n=2),'RL':dict(n=2)}
FOCUS='LL0'   # 放大的肺泡床：左下葉（左肺動脈末端同軸延續 → 葉動脈 → 小動脈，追蹤血球可以一段接一段走到這裡）
FOCUS_SPEC=(2.9e-3,12,3,0.23e-3,0.0030)   # 放大的肺泡床：肺泡半徑、個數、每個肺泡的微血管條數、微血管半徑、depart 長度
BKG_SPEC=(1.4e-3,4,4,0.28e-3,0.0022)
# ---------- 肺靜脈：資料集網格只有心房端 1～1.5 cm 的短管，肺內段為示意 ----------
PVSTUB={'LS':dict(atr=[0.0403,1.3171,0.0424],lat=[0.0512,1.3175,0.0462],lobes=['LU']),
        'LI':dict(atr=[0.0384,1.2949,0.0303],lat=[0.0500,1.2928,0.0333],lobes=['LL']),
        'RS':dict(atr=[-0.0146,1.3105,0.0428],lat=None,lobes=['RU','RM']),
        'RI':dict(atr=[-0.0032,1.2960,0.0328],lat=[-0.0220,1.2946,0.0277],lobes=['RL'])}
rs_p=rsv[0];rs_c=_cum(rs_p);PVSTUB['RS']['lat']=path_at(rs_p,rs_c,0.013).tolist()   # 右上肺靜脈網格很長，只用心房端 13 mm（再往外會貼到右肺動脈下面）
LA_C=np.array([0.0195,1.3050,0.0470])   # 左心房腔內（血球終點）
PV_OUT={'LS':[0.014,0.007,0.003],'LI':[0.014,-0.007,0.003],'RS':[-0.014,0.003,0.005],'RI':[-0.014,-0.007,0.0]}   # 肺門外側的起點（相對網格外側端，公尺）
R_PV_OS=5.0e-3   # 肺靜脈近心房端繪製半徑（直徑 10 mm；示意，見 sources.md「肺場景」）
pvP={}
for k,d in PVSTUB.items():
  atr=np.array(d['atr']);lat=np.array(d['lat']);H=lat+np.array(PV_OUT[k]);dirIn=unit(atr-lat)
  mid=lat+(H-lat)*0.45+np.array([0,0.002,0])
  P=spline([H,mid,lat,atr,atr+unit(LA_C-atr)*0.006+dirIn*0.002,LA_C],0.0012)
  pvP[k]=smooth_path(P,passes=14,ramp=0.008)
  print('PV',k,'H',H.round(4),[kk for kk in HULL if in_hull(HULL[kk],[H])[0]],'len mm',round(float(_cum(pvP[k])[-1])*1000,1))

# ---------- 動脈：葉動脈 ----------
AVOID_TREE=cKDTree(np.vstack([pvP[k] for k in pvP]+[paL_p,paR_p,trunk_p]))   # 肺泡床離肺靜脈、肺動脈主幹至少 20 mm
c_paL=_cum(paL_p)
S_LU_B=0.020   # 左上葉動脈從左肺動脈分出的位置（弧長，m；下面依『母管切線與目標方向的夾角最小』重選）
_sp=pick_sites('LU',path_at(paL_p,c_paL,S_LU_B),0.010,n=1,dmin=0.050,dmax=0.085)[0]
_best=None
for _s in np.arange(0.010,0.050,0.002):
  _T=unit(path_at(paL_p,c_paL,_s+0.003)-path_at(paL_p,c_paL,_s-0.003));_a=float(np.arccos(np.clip(_T@unit(_sp-path_at(paL_p,c_paL,_s)),-1,1)))
  if _best is None or _a<_best[0]: _best=(_a,_s)
S_LU_B=float(_best[1]);print('LU branch at',S_LU_B,'angle',np.degrees(_best[0]))
O_LU=path_at(paL_p,c_paL,S_LU_B)
origins={'LU':O_LU,'LL':paL_p[-1],'RU':paR_p[-1],'RM':None,'RL':None}
sites={}
sites['LU']=pick_sites('LU',O_LU,0.010,dmin=0.050,dmax=0.085)
sites['LL']=pick_sites('LL',paL_p[-1],0.016,n=1,dmin=0.060,dmax=0.110,avoid=0.046)   # 第一個＝放大的肺泡床（FOCUS）
sites['LL']+=pick_sites('LL',paL_p[-1],0.010,n=2,dmin=0.045,dmax=0.080,first=sites['LL'][0])[1:]
sites['RU']=pick_sites('RU',paR_p[-1],0.010,dmin=0.050,dmax=0.080)
sites['RM']=pick_sites('RM',paR_p[-1],0.010,dmin=0.055,dmax=0.085)
sites['RL']=pick_sites('RL',paR_p[-1],0.010,dmin=0.055,dmax=0.085)
for k,v in sites.items(): print('sites',k,[np.round(x,4).tolist() for x in v])
# ---------- 建樹 ----------
def gtaper(P,a,b):
  """沿弧長的等比漸變（每單位長度的相對變化一樣），兩端以 smoothstep 緩和：由粗變細（或由細變粗）不會在某一段突然變細"""
  c=_cum(P);t=ss(c/c[-1])*0.6+0.4*(c/c[-1]);return a*(b/a)**t
def y_taper(R,P,frac=2**(-1/3),Lt=None):
  """Y 形分叉的母管：最後 Lt 公尺內半徑平滑收到子管起點半徑（＝母管末端×2^(-1/3)），兩條子管從末端同軸、同半徑出發再分開，接點沒有台階、沒有圓頭"""
  R=np.asarray(R,float).copy();c=_cum(P);re_=float(R[-1])*frac;Lt=Lt or max(0.008,1.6*float(R[-1]));w=ss((c-(c[-1]-Lt))/Lt);return (1-w)*R+w*np.minimum(R,re_)

def repel(P,R,obsP,obsR,fix0,fix1,clear=0.0008,iters=200):
  """把 P 中段推離障礙物（其他血管的中心線點），兩端 fix0／fix1 公尺內不動；位移沿路平滑，保持管形平順"""
  P=np.asarray(P,float).copy();R=np.broadcast_to(np.asarray(R,float),(len(P),));c=_cum(P);w=ss((c-fix0)/0.012)*ss((c[-1]-fix1-c)/0.012)
  if not len(obsP): return P
  tr=cKDTree(obsP);obsR=np.asarray(obsR)
  for _ in range(iters):
    d,j=tr.query(P,k=6);d=np.atleast_2d(d);j=np.atleast_2d(j)
    need=R[:,None]+obsR[j]+clear;viol=need-d;k=np.argmax(viol,axis=1);v=viol[np.arange(len(P)),k];q=obsP[j[np.arange(len(P)),k]]
    if v.max()<=0: break
    dirn=P-q;dirn/=np.linalg.norm(dirn,axis=1)[:,None]+1e-12;disp=np.where(v[:,None]>0,dirn*v[:,None]*0.6,0)
    for _s in range(30): disp[1:-1]=0.25*disp[:-2]+0.5*disp[1:-1]+0.25*disp[2:]
    P=P+disp*w[:,None]*0.5
  return P
def obstacles(ids):
  ps=[];rs=[]
  for i in ids:
    sg=segs[i];p=np.asarray(sg['points']);r=np.asarray(sg['radius']);u=sg.get('tubeRange',[0,1]);n=len(p);a,b=int(u[0]*(n-1)),int(np.ceil(u[1]*(n-1)))+1
    ps.append(p[a:b]);rs.append(r[a:b])
  return (np.vstack(ps),np.concatenate(rs)) if ps else (np.zeros((0,3)),np.zeros(0))

R_VEN_END=1.6e-3   # 小靜脈到肺靜脈匯入點的半徑（示意；第一條同軸接上肺靜脈起點）
R_VEN_SIDE=1.3e-3   # 從側面匯入肺靜脈的小靜脈末端半徑（比肺靜脈細，開口貼著肺靜脈內壁）
def bed_x0(k,j):
  if f'{k}{j}'==FOCUS: return -(FOCUS_SPEC[0]*(1.3*FOCUS_SPEC[1]**(1/3)+1.0)+0.004)   # 圓團：從中心往肺門退『團半徑＋4 mm』就是小動脈根
  return BKG_SPEC[0]*(-(2.1*(BKG_SPEC[1]-1)/2)-1-2.2)
def lobar_end(origin,k,frac=0.5):
  A=[np.asarray(O)+unit(np.asarray(O)-origin)*bed_x0(k,j) for j,O in enumerate(sites[k])];return origin+(np.mean(A,0)-origin)*frac
def lobar(origin,T0,sts,ell,r,frac=0.5,bend=None,k=None):
  S=lobar_end(origin,k,frac);dd=np.linalg.norm(S-origin)
  return hermite_path([origin,S],T0,arc_end(origin,S,T0))
T_paL=unit(paL_p[-1]-paL_p[-4]);T_paR=unit(paR_p[-1]-paR_p[-4])
lob={};lobR={}
# 左上葉：左肺動脈中段的側支
_S=lobar_end(O_LU,'LU');P_LU,paL_r=side_branch(paL_p,paL_r,S_LU_B,5.2e-3,[O_LU+(_S-O_LU)*0.5,_S])
lob['LU']=P_LU;lobR['LU']=taper(len(P_LU),5.2e-3,4.4e-3)
# 左下葉：左肺動脈末端同軸延續
lob['LL']=lobar(paL_p[-1],T_paL,sites['LL'],0.012,float(paL_r[-1]),k='LL');lobR['LL']=taper(len(lob['LL']),float(paL_r[-1]),0.85*float(paL_r[-1]))
# 右：右肺動脈末端 Y 形分成上葉動脈與葉間動脈（往中、下葉）
rRY=float(paR_r[-1]*2**(-1/3));paR_r=y_taper(paR_r,paR_p)
lob['RU']=lobar(paR_p[-1],T_paR,sites['RU'],0.012,rRY,k='RU');lobR['RU']=taper(len(lob['RU']),rRY,0.85*rRY)
RI_t=lobar_end(paR_p[-1],'RL');_W=paR_p[-1]+T_paR*0.4*np.linalg.norm(RI_t-paR_p[-1]);P_RI=hermite_path([paR_p[-1],RI_t],T_paR,arc_end(paR_p[-1],RI_t,T_paR))
R_RI=taper(len(P_RI),rRY,0.9*rRY)
S_RM_B=0.020;OM=path_at(P_RI,_cum(P_RI),S_RM_B);mRM=lobar_end(OM,'RM')
P_RM,R_RI=side_branch(P_RI,R_RI,S_RM_B,3.6e-3,[OM+(mRM-OM)*0.5,mRM])
lob['RM']=P_RM;lobR['RM']=taper(len(P_RM),3.6e-3,3.1e-3)
lob['RL']=P_RI;lobR['RL']=R_RI
named={'lobar':{}}
for k,P in lob.items():
  sid='a_'+k;src={'LU':'side branch of the left pulmonary artery (upper lobe)','LL':'continuation of the left pulmonary artery (lower lobe)','RU':'right pulmonary artery -> upper lobe','RM':'side branch of the interlobar artery (middle lobe)','RL':'interlobar artery -> lower lobe'}[k]
  lobR[k]=y_taper(lobR[k],P)
  put(sid,P,lobR[k],'artery','poor','generated: schematic lobar pulmonary artery, '+src+' (paths are not anatomical)',True,capStart=False,capEnd=False)
  named['lobar'][k]=sid
# 母管半徑更新（側支分出後依 Murray 變細）
# ---------- 肺泡床、小動脈、微血管、小靜脈 ----------
BED_ORDER={'LS':['LU0','LU1'],'LI':['LL0','LL1'],'RS':['RU0','RU1','RM0','RM1'],'RI':['RL0','RL1']}
SJ_STEP=0.0045
pv_join={}
for pk,names in BED_ORDER.items():
  P=pvP[pk];c=_cum(P)
  for j,nm in enumerate(names):
    sj=j*SJ_STEP;pv_join[nm]=(path_at(P,c,sj),unit(path_at(P,c,sj+0.003)-path_at(P,c,max(sj-0.003,0))) if j>0 else unit(P[3]-P[0]),pk,j)
# ---------- 肺靜脈 ----------
for pk,P in pvP.items():
  c=_cum(P);names=BED_ORDER[pk];SJ=[j*SJ_STEP for j in range(len(names))]
  rm=(R_VEN_END**3+sum(R_VEN_SIDE**3*ss((c-sj+0.002)/0.004) for sj in SJ[1:]))**(1/3)   # Murray：第一條小靜脈同軸接上，其後每條從側面匯入（半徑 R_VEN_SIDE）就依 r³ 相加變粗
  atr=np.array(PVSTUB[pk]['atr']);lat=np.array(PVSTUB[pk]['lat'])
  cl=c[int(np.argmin(np.linalg.norm(P-lat,axis=1)))];ca=c[int(np.argmin(np.linalg.norm(P-atr,axis=1)))]
  t_=np.clip((c-SJ[-1])/max(ca-SJ[-1],1e-6),0,1);t_=0.6*ss(t_)+0.4*t_;r=np.where(c<=SJ[-1],rm,rm[np.searchsorted(c,SJ[-1])]*(R_PV_OS/rm[np.searchsorted(c,SJ[-1])])**t_)   # 匯完最後一條小靜脈後，一路平滑變粗到心房開口（不在短距離內突然變粗）
  u_end=min(0.99,(ca+0.002)/c[-1])
  put('pv_'+pk,P,r,'vein','rich','generated (schematic intrapulmonary part) + mesh direction of %s_pulmonary_vein near the left atrium; drawn up to the atrial wall'%{'LS':'left_superior','LI':'left_inferior','RS':'right_superior','RI':'right_inferior'}[pk],True,
      capStart=False,capEnd=False,tubeRange=[0.0,round(float(u_end),4)])
beds={}
for k,P in lob.items():
  S=P[-1];TS=unit(P[-1]-P[-4]);rs0=float(segs['a_'+k]['radius'][-1])   # 葉動脈末端已收到子管半徑（y_taper）
  for j,O in enumerate(sites[k]):
    nm=f'{k}{j}';foc=nm==FOCUS
    Jp=pv_join[nm][0];e1=unit(O-(0.5*S+0.5*Jp))
    bd=(make_bed_clump if foc else make_bed)(nm,k,np.asarray(O,float),e1,*(FOCUS_SPEC if foc else BKG_SPEC),nref=S-Jp)
    A0=bd['rootA'] if foc else bd['Ap'](bd['x0']);dS=np.linalg.norm(A0-S)
    side=unit(np.cross(TS,e1)) if np.linalg.norm(np.cross(TS,e1))>1e-6 else bd['b']
    route=hermite_path([S,A0],TS,bd['atan'] if foc else e1)
    route=repel(route,taper(len(route),rs0,bd['r0'],0.7),*obstacles([q for q in segs if q.startswith('pv_')]),0.012,0.010)
    if foc:
      sp=route;rr=gtaper(route,rs0,bd['r_root'])
      put('s_'+nm,sp,rr,'arteriole','poor','generated: schematic segmental artery -> arteriole running to the clump of alveoli (diameters enlarged)',True,capStart=False,capEnd=False)
      for q,av in enumerate(bd['arts']):
        put(f'sb_{nm}_{q}',av['p'],av['r'],'arteriole','poor','generated: schematic arteriole branch running over the alveolar surface (Murray radii; diameters enlarged)',True,capStart=False,capEnd=False)
    else:
      xs=np.linspace(bd['x0'],bd['x1'],int((bd['x1']-bd['x0'])/0.0004)+1);spine=np.array([bd['Ap'](x) for x in xs])
      sp=cat(route,spine);cr=_cum(route)[-1];c=_cum(sp)
      ev=sorted(cp['xa'] for cp in bd['caps'] if not cp.get('U'))
      rsp=spine_radius(ev,xs,bd['rc'],bd['N'],0.0016)
      rr=np.r_[gtaper(route,rs0,bd['r0']),rsp[1:]][:len(sp)]
      put('s_'+nm,sp,rr,'arteriole','poor','generated: schematic segmental artery -> arteriole running along a row of alveoli (diameters enlarged)',True,capStart=False,capEnd=False)
    for q,cp in enumerate(bd['caps']):
      cid=f'c_{nm}_{q}'
      rc=bd['rc'];cpp=cp['p'];cc=_cum(cpp);rcap=rc*(1-0.08*np.sin(np.pi*cc/cc[-1]))   # 中段略細（示意）
      put(cid,cpp,rcap,'capillary','poor>rich','generated: schematic alveolar capillary over the alveolus surface (enlarged; real ~8 µm)',True,capStart=False,capEnd=False)
    for q,fd in enumerate(bd.get('feeds',[])):
      put(f'sb_{nm}_{q}',fd['p'],bd['rb'],'arteriole','poor','generated: schematic arteriole branch from the arteriole to the top of one alveolus (splits into its capillaries; diameters enlarged)',True,capStart=False,capEnd=False)
    for q,dr in enumerate(bd.get('drains',[])):
      put(f'vb_{nm}_{q}',dr['p'],bd['rb'],'vein','rich','generated: schematic venule branch collecting the capillaries of one alveolus -> venule (diameters enlarged)',True,capStart=False,capEnd=False)
    for q,vv in enumerate(bd.get('vens',[])):
      put(f'vb_{nm}_{q}',vv['p'],vv['r'],'vein','rich','generated: schematic venule branch over the alveolar surface collecting the capillaries (Murray radii; diameters enlarged)',True,capStart=False,capEnd=False)
    for q,rg in enumerate(bd['rings']):
      put(f'n_{nm}_{q}',rg['p'],bd['rc']*0.92,'capillary',rg['o2'],'generated: schematic alveolar capillary net (open latitude arc on the outer face of the alveolus, forms the polygon net with c_*; drawn only, no flow)',True,capStart=True,capEnd=True)
    # 小靜脈：沿肺泡另一側的脊（x1→x0）收集微血管，再走回肺門匯入肺靜脈
    if foc: xv=None;vsp=np.zeros((0,3))
    else: xv=xs[::-1];vsp=np.array([bd['Vp'](x) for x in xv])
    J,TJ,pk,jj=pv_join[nm];V0=bd['rootV'] if foc else bd['Vp'](bd['x0'])
    if jj>0:   # 從側面併入肺靜脈：終點從肺靜脈中心往來的那一側移 (r肺靜脈−r小靜脈)，開口貼著肺靜脈內壁
      _P=pvP[pk];_c=_cum(_P);_rp=float(np.interp(cKDTree(_P).query(J)[1],np.arange(len(_P)),segs['pv_'+pk]['radius']));_w=V0-J;_pp=unit(_w-(_w@TJ)*TJ);J=J+_pp*max(0.0,_rp-R_VEN_SIDE)*0.5
    wps=[]   # 先試兩點 Hermite（最平順）；穿過動脈才在穿過處加一個推開的中途點
    AO=obstacles([q for q in segs if q.startswith(('pa_','a_','s_'))]);AT=cKDTree(AO[0])
    for it in range(6):
      vr=hermite_path([V0]+wps+[J],bd['vtan'] if foc else -e1,TJ);cv_=_cum(vr)
      d_,j_=AT.query(vr);viol=AO[1][j_]+R_VEN_END+0.0015-d_;viol[(cv_<0.006)|(cv_>cv_[-1]-0.010)]=-1
      if viol.max()<=0: break
      iw=int(np.argmax(viol));q_=AO[0][j_[iw]];newp=vr[iw]+unit(vr[iw]-q_)*(viol[iw]+0.003)
      allp=[V0]+wps+[J];ins=int(np.searchsorted([_cum(np.array(allp))[i] for i in range(len(allp))],cv_[iw]*_cum(np.array(allp))[-1]/cv_[-1]))
      wps.insert(max(0,min(len(wps),ins-1)),newp)
    vr=hermite_path([V0]+wps+[J],bd['vtan'] if foc else -e1,TJ)
    if foc:
      vp=vr;rvr=gtaper(vr,bd['r_rootV'],R_VEN_END if jj==0 else R_VEN_SIDE);rvfull=rvr
    else:
      vp=cat(vsp,vr)
      evj=[cp['xb'] for cp in bd['caps'] if not cp.get('U')]
      cnt=1+sum(ss((xb-xv+0.0008)/0.0016) for xb in evj);rv=bd['rc']*cnt**(1/3)
      rvr=gtaper(vr,bd['r0'],R_VEN_END if jj==0 else R_VEN_SIDE);rvfull=np.r_[rv,rvr[1:]][:len(vp)]
    put('v_'+nm,vp,rvfull,'vein','rich','generated: schematic venule collecting the alveolar capillaries -> intrapulmonary vein (diameters enlarged)',True,capStart=False,capEnd=False)
    if foc:
      TRACER_INFO={'alv':bd['tracer']['alv'],'art':[x.replace('ID',nm) for x in bd['tracer']['art']],'cap':bd['tracer']['cap'],'ven':[x.replace('ID',nm) for x in bd['tracer']['ven']]}
      print('TRACER',TRACER_INFO)
    beds[nm]=bd
# ---------- 小靜脈推離動脈（不相連的管不可互相穿過）----------
ART=[q for q in segs if q.startswith(('pa_','a_','s_'))]
for nm,bd in beds.items():
  sid='v_'+nm;sg=segs[sid];P=np.asarray(sg['points']);c=_cum(P)
  own=[q for q in segs if q.startswith('pv_') and nm not in BED_ORDER[q[3:]]]+[q for q in ART if not q.endswith(nm)]
  pass   # （逐點推開會造成折角，改在建路徑時把中途點推離動脈）
# ---------- 左心房 → 左心室 → 主動脈（第 5 步：接大循環）----------
lv_in=np.array([0.045,1.27,0.08]);lv_or=np.array([0.0121,1.3162,0.0779])
lap=cat(bez(LA_C,LA_C+np.array([0.006,-0.012,0.012]),lv_in+np.array([-0.010,0.006,-0.010]),lv_in,18))
put('la_lv',lap,0.010,'chamber','rich','generated: left_atrium -> mitral valve -> left_ventricle interior',True)
lvp=cat(bez(lv_in,lv_in+np.array([-0.004,0.012,0]),lv_or+np.array([0.008,-0.010,0]),lv_or,14),line(lv_or,asc[0][0]))
put('lv_out',lvp,0.012,'chamber','rich','generated: left_ventricle interior -> aortic orifice loop',True)
ao=resamp(cat(asc[0],arch[0]),0.002);ao_r=_ma(np.interp(np.linspace(0,1,len(ao)),np.linspace(0,1,len(asc[1])+len(arch[1])-1),np.r_[asc[1],arch[1][1:]]),9)   # 只給血球走（主動脈畫的是資料集網格）；半徑平滑，血球大小不會忽大忽小
put('aorta',ao,ao_r,'artery','rich','mesh: ascending_aorta + aortic_arch')
put('pa_L',paL_p,paL_r,'artery','poor','mesh: left_pulmonary_artery (+ generated link from the bifurcation)',False,radius_mesh=paL_rm,capStart=False,capEnd=False)
put('pa_R',paR_p,paR_r,'artery','poor','mesh: right_pulmonary_artery (+ generated link from the bifurcation)',False,radius_mesh=paR_rm,capStart=False,capEnd=False)
# ---------- 管口封口（接力指南 5b 第 4 點）----------
# 同軸同半徑相接（左肺動脈→左下葉動脈、小動脈脊→U 形微血管→小靜脈、第一條小靜脈→肺靜脈）兩邊都不封；
# 肺動脈幹起點埋在右心室流出道、肺靜脈末端到左心房壁為止：不封。
# 這個場景沒有游離末端：Y 形分叉用「母管末端收到子管半徑＋子管同軸同半徑出發」、側支與側面匯入用「開口貼著母管內壁」，所以全部不封口（不會出現圓頭）
for k in segs: segs[k]['capStart']=False;segs[k]['capEnd']=False
# 肺靜脈畫到左心房壁為止：中心線上離左心房網格表面最近的點＝穿過心房壁的位置（只在資料集肺靜脈心房端前後 12 mm 內找）；
# 最後 7 mm 半徑放大到 1.25 倍（肺靜脈開口呈漏斗狀；管口的環落在心房壁上，不會像平口的管子插進心房）
LAtree=cKDTree(mesh(CV+'left_atrium')[0])
for pk in pvP:
  sg=segs['pv_'+pk];P=np.asarray(sg['points']);c=_cum(P);atr=np.array(PVSTUB[pk]['atr']);ia=int(np.argmin(np.linalg.norm(P-atr,axis=1)))
  win=np.where(np.abs(c-c[ia])<0.012)[0];dd=LAtree.query(P[win])[0];iw=int(win[np.argmin(dd)])
  ce=c[iw]+0.0005;u_end=round(float(min(0.99,ce/c[-1])),4);sg['tubeRange']=[0.0,u_end]
  fl=ss((c-(ce-0.007))/0.007);sg['radius']=np.asarray(sg['radius'])*(1+0.25*fl*(c<=ce+0.002))
  print('PV',pk,'wall at mm',round(c[iw]*1000,1),'atrial stub end at',round(c[ia]*1000,1),'surface dist mm',round(float(dd.min())*1000,2))
# ======================== 驗證 ========================
report={}
def lobe_of(sid):
  m=re.match(r'^(?:a|s|v|c|n|sb|vb)_([LR][ULM])',sid)
  return m.group(1) if m else None
import re
for sid,sg in segs.items():
  p=np.asarray(sg['points'],float);c=_cum(p)
  if sid.startswith(('a_','s_','v_','c_','n_','sb_','vb_')):
    k=lobe_of(sid);mask=np.ones(len(p),bool)
    if sid.startswith('a_'): mask=c>0.012   # 葉動脈起點在肺門（肺葉凸包外）
    if sid.startswith('v_'): mask=(c[-1]-c)>0.012   # 小靜脈最後 12 mm 在肺門匯入肺靜脈
    q=p[mask];hk=[kk for kk in HULL]   # 主要：所屬肺葉凸包；肺葉之間的葉間裂處允許落在同側相鄰葉的凸包
    same=[kk for kk in HULL if kk[0]==k[0]]
    okh=np.any([in_hull(HULL[kk],q) for kk in same],axis=0)
    okm=np.array([any(in_mesh(kk,x) for kk in same) for x in q[::4]])
    report[sid]=dict(n=int(len(q)),inside_hull=int(okh.sum()),inside_mesh_sampled=int(okm.sum()),n_mesh_sampled=int(len(okm)),test='inside convex hull of the same-side lung lobe meshes, 0.5 mm margin (excluded: first 12 mm of lobar arteries a_*, last 12 mm of venules v_*, at the hilum); inside_mesh_sampled = odd-parity ray test on every 4th point (supplementary)')
  if sid.startswith('pv_'):
    k=sid[3:];same=[kk for kk in HULL if kk[0]==k[0]];m_=(c>0)&(c<0.022)   # 肺靜脈只有肺內的前 22 mm 在肺裡，其後出肺門到左心房
    okh=np.any([in_hull(HULL[kk],p[m_]) for kk in same],axis=0);report[sid]=dict(n=int(m_.sum()),inside_hull=int(okh.sum()),test='first 22 mm (inside the lung) in the same-side lobe hulls')
  if sg['schematic'] and sg['kind']!='chamber':
    q,i=min_curv_ratio(p,sg['radius']);report.setdefault(sid,{})['min_curv_over_r']=round(q,2)
bad=[(k,v) for k,v in report.items() if 'inside_hull' in v and v['inside_hull']<v['n']]
print('HULL fails',len(bad),[(k,v['n']-v['inside_hull']) for k,v in bad][:20])
mc=sorted((v['min_curv_over_r'],k) for k,v in report.items() if 'min_curv_over_r' in v)
print('min curvature/r (lowest 10)',mc[:10])
# 管與管的間隙（畫出來的範圍）：中心線點距離 − 兩管半徑 < 0 就是互相穿過；相連的兩段在接點 25 mm（或 4 倍半徑）內不算
def drawn(sid):
  sg=segs[sid];p=np.asarray(sg['points']);r=np.asarray(sg['radius']);u=sg.get('tubeRange',[0,1]);n=len(p);a,b=int(u[0]*(n-1)),int(np.ceil(u[1]*(n-1)))+1;return p[a:b],r[a:b]
big=[k for k in segs if segs[k]['kind']!='chamber' and not k.startswith(('c_','n_')) and k!='aorta']   # aorta 只是血球路徑（畫的是資料集網格；資料集的肺動脈幹本來就貼著主動脈）
D_={k:drawn(k) for k in big};TR_={k:cKDTree(D_[k][0]) for k in big}
overl=[]
for i,a in enumerate(big):
  pa,ra=D_[a]
  for b_ in big[i+1:]:
    pb,rb=D_[b_];d,j=TR_[b_].query(pa);gap=d-ra-rb[j]
    if gap.min()>=0: continue
    # 接點：兩段的端點彼此靠近（< 兩管半徑和）
    ends=[e for e in (pa[0],pa[-1]) if TR_[b_].query(e)[0]<(ra.max()+rb.max())]+[e for e in (pb[0],pb[-1]) if TR_[a].query(e)[0]<(ra.max()+rb.max())]
    m=gap<0
    for e in ends: m&=np.linalg.norm(pa-e,axis=1)>max(0.025,4*ra.max())
    if m.any(): overl.append((round(float(gap[m].min())*1000,2),a,b_,int(m.sum())))
print('OVERLAP (not at junctions):',sorted(overl))
report['_overlap_not_at_junctions']=[list(x) for x in overl]
# 其他幹線的曲率（網格段＋分叉補段）
for sid in ('pa_trunk','pa_L','pa_R'):
  q,i=min_curv_ratio(segs[sid]['points'],segs[sid]['radius']);report.setdefault(sid,{})['min_curv_over_r']=round(q,2)
print('trunk/PA curvature',[(s_,report[s_]['min_curv_over_r']) for s_ in ('pa_trunk','pa_L','pa_R')])
# ======================== 輸出 ========================
sacs={'alvFocus':[],'alv':[]}
for nm,bd in beds.items():
  for C,Rq in zip(bd['C'],bd['Ras']): sacs['alvFocus' if nm==FOCUS else 'alv'].append([round(float(v),5) for v in C]+[round(float(Rq),5)])
fb=beds[FOCUS]
named=dict(tracer=TRACER_INFO,focus=FOCUS,focus_center=np.round(fb['O'],5).tolist(),focus_axes=dict(e1=np.round(fb['e1'],4).tolist(),n=np.round(fb['n'],4).tolist(),b=np.round(fb['b'],4).tolist()),
  focus_caps=[f'c_{FOCUS}_{q}' for q in range(len(fb['caps']))],beds=list(beds),bed_centers={k:np.round(v['O'],5).tolist() for k,v in beds.items()},
  pv_order=BED_ORDER,lobar=named['lobar'],bifurcation=np.round(B,5).tolist(),la_center=np.round(LA_C,5).tolist())
def seg_out(v):
  o=dict(kind=v['kind'],o2=v['o2'],source=v['source'],schematic=v['schematic'],points=np.round(v['points'],5).tolist(),radius=np.round(v['radius'],6).tolist())
  for kk in ('radius_mesh',):
    if kk in v: o[kk]=np.round(np.asarray(v[kk]),5).tolist()
  if 'tubeRange' in v: o['tubeRange']=v['tubeRange']
  if v.get('capStart') is False: o['capStart']=False
  if v.get('capEnd') is False: o['capEnd']=False
  return o
out=dict(version='lung_centerlines_v1',units='m',axes='+X body left, +Y up, +Z anterior (same as si_scene_v1.glb)',generator='tools/anatomy/build_lung_centerlines.py',
 note='mesh: centerline and radius estimated from the glb mesh (pulmonary trunk, left/right pulmonary arteries, aorta); the trunk-to-branch gap and everything inside the lungs (lobar/segmental arteries, arterioles, alveolar capillaries, venules, intrapulmonary pulmonary veins), the alveoli (sacs) and the chamber links are generated schematics, not anatomical data; calibres of small vessels and alveoli are enlarged.',
 validation=dict(method='generated intrapulmonary points inside the convex hull of the same-side lobe meshes (0.5 mm margin; hilum parts excluded as listed per segment) + supplementary odd-parity ray test; min curvature radius / tube radius; drawn tubes that are not joined must not intersect (centerline distance >= r1+r2)',results=report),
 named=named,sacs=sacs,segments={k:seg_out(v) for k,v in segs.items()})
json.dump(out,open(sys.argv[2],'w'),separators=(',',':'))
print('wrote',sys.argv[2],len(segs),'segments',sum(len(v) for v in sacs.values()),'alveoli')

# 血管接點整理（老師 2026-11-23：不要錐形殘端、半徑要連續漸變；規則見 tools/anatomy/polish_vessels.py 檔頭）
import os as _os, sys as _sys
_sys.path.insert(0, _os.path.dirname(_os.path.abspath(__file__)))
import polish_vessels as _pv
_pv.polish_path(sys.argv[2])
