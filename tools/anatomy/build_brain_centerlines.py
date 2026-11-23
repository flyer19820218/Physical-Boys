#!/usr/bin/env python3
"""build_brain_centerlines.py -- 「腦部：組織細胞」場景（ht3d_scene_brain_1122_v1.js）的血流路徑：
左心室 → 升主動脈 → 主動脈弓 → 頭臂動脈幹／左頸總動脈／左鎖骨下動脈 → 頸總動脈 → 頸內動脈；鎖骨下動脈 → 椎動脈 → 基底動脈
→ 大腦動脈環（前、後交通動脈）→ 大腦前／中／後動脈 → 腦表面的小動脈（示意）→ 灰質裡的微血管床（示意）→ 小靜脈 → 腦靜脈（示意）
→ 上矢狀竇 → 左右橫竇 → 乙狀竇 → 內頸靜脈 →（＋鎖骨下靜脈）頭臂靜脈 → 上腔靜脈 → 右心房 → 右心室。

用法（在 repo 根目錄）：
  node tools/anatomy/extract_brain_scene.mjs --data <3d-anatomy-atlas>/packages/data/releases/1.2.0 --modules /tmp/gl/node_modules
  node tools/anatomy/dump_glb_world.mjs assets/biology/anatomy3d/brain_scene_v1.glb /tmp/brain_world.json --modules /tmp/gl/node_modules
  python3 tools/anatomy/build_brain_centerlines.py /tmp/brain_world.json assets/biology/anatomy3d/brain_centerlines_v1.json
  （約 4 分鐘；亂數種子固定，重跑結果相同。開發時可設 BRAIN_CL_CACHE=<檔> 快取網格中心線。）

方法函式（中心線估計、切面、depart／arrive／smooth_path、Murray 等）原樣複製自 build_lung_centerlines.py（不 import，因為那支是直接執行的腳本）。
接點畫法照 docs/ht3d_接力指南.md 第 5b 節：每段半徑陣列、切線相接（depart／arrive；側支從母管中心線沿母管切線離開，
用 tubeRange 從母管壁才開始畫）、半徑連續＋Murray（母³＝Σ子³）、匯流逐一匯入、同軸同半徑接點兩邊 capStart/capEnd=false、
埋進大血管或心房壁的管口不封；圓頭只留在游離末端（鎖骨下動脈／靜脈的外側端、胸主動脈下端、大腦前動脈末端、上矢狀竇前端）。

腦表面的血管（示意）：在 1 mm 格點上標出腦網格內外（沿 y 軸奇偶射線），A* 在腦外找路（偏好離腦表面 1～3 mm），
再用「限制下的平滑」（拉普拉斯平滑＋把穿進腦的點推出去，反覆）磨圓。
微血管床（示意）：在皮質表面找一塊平、灰質厚的地方（S0、法線 n、切線 e1/e2），沿 −n 打射線量軟腦膜面高度 H(u,v) 與灰質厚度 t(u,v)，
在 (u,v,深度) 參數空間建床：軟腦膜小動脈 → 穿入灰質的小動脈 → 微血管（三或四層，交錯成網；放大床另有不放血球的交叉連通支）→ 上行小靜脈 → 軟腦膜小靜脈。
驗證（結果寫在 JSON 的 validation）：灰質裡的點全部在腦網格內（x/y/z 三軸奇偶射線多數決）；軟腦膜血管在腦外、離表面 ≤ 1.5 mm；
最小曲率半徑÷管半徑；畫出來的管兩兩不相穿（相連的接點附近除外）。
需要：numpy、scipy。
"""
import json,sys,os,re,heapq,numpy as np
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
def ray_count(P,T,o,d):
  v0=P[T[:,0]];e1=P[T[:,1]]-v0;e2=P[T[:,2]]-v0
  h=np.cross(d,e2);a=(e1*h).sum(1);ok=np.abs(a)>1e-14;f=np.where(ok,1/np.where(ok,a,1),0)
  s=o-v0;u=f*(s*h).sum(1);q=np.cross(s,e1);v=f*(q*d).sum(1);t=f*(e2*q).sum(1)
  return int((ok&(u>=0)&(v>=0)&(u+v<=1)&(t>1e-7)).sum())
def min_curv_ratio(p,r):
  """最小（曲率半徑 ÷ 管半徑）。曲率半徑＝點間距÷轉角"""
  p=np.asarray(p,float);a=p[1:-1]-p[:-2];b=p[2:]-p[1:-1];la=np.linalg.norm(a,axis=1);lb=np.linalg.norm(b,axis=1)
  c=np.clip((a*b).sum(1)/(la*lb+1e-15),-1,1);ang=np.arccos(c);R=0.5*(la+lb)/np.maximum(ang,1e-9)
  rr=np.asarray(r,float)[1:-1];q=R/rr;i=int(np.argmin(q));return float(q[i]),i
def tan_at(P,i,k=3):
  P=np.asarray(P,float);a=max(0,i-k);b=min(len(P)-1,i+k);return unit(P[b]-P[a])
def resamp(P,step):
  P=np.asarray(P,float);c=_cum(P);n=max(3,int(c[-1]/step)+1);s=np.linspace(0,c[-1],n);return np.stack([np.interp(s,c,P[:,q]) for q in range(3)],1)

# ---------------- 腦場景用的工具：奇偶射線內外判斷、表面取樣、自由空間格點、A*、皮質小區塊 ----------------
import numpy as np
from collections import defaultdict
class Inside:
  """奇偶射線法（沿 +x、+y、+z 三軸各一條射線，多數決）。三角形依投影面格子分桶，查詢只看同一格的三角形。"""
  def __init__(s,P,T,cell=0.002):
    s.P=np.asarray(P,float);s.T=np.asarray(T);s.V=s.P[s.T];s.cell=cell;s.B=[]
    for ax in range(3):
      a,b=[q for q in range(3) if q!=ax];lo=s.V[:,:,[a,b]].min(1);hi=s.V[:,:,[a,b]].max(1)
      i0=np.floor(lo/cell).astype(int);i1=np.floor(hi/cell).astype(int);d=defaultdict(list)
      for t in range(len(s.T)):
        for i in range(i0[t,0],i1[t,0]+1):
          for j in range(i0[t,1],i1[t,1]+1): d[(i,j)].append(t)
      s.B.append({k:np.array(v) for k,v in d.items()})
  def count(s,p,ax):
    a,b=[q for q in range(3) if q!=ax];k=(int(np.floor(p[a]/s.cell)),int(np.floor(p[b]/s.cell)))
    ts=s.B[ax].get(k)
    if ts is None: return 0
    V=s.V[ts];A=V[:,0,[a,b]];Bv=V[:,1,[a,b]];C=V[:,2,[a,b]];q=np.array([p[a],p[b]])
    v0=Bv-A;v1=C-A;v2=q-A;den=v0[:,0]*v1[:,1]-v1[:,0]*v0[:,1];ok=np.abs(den)>1e-18;den=np.where(ok,den,1)
    u=(v2[:,0]*v1[:,1]-v1[:,0]*v2[:,1])/den;w=(v0[:,0]*v2[:,1]-v2[:,0]*v0[:,1])/den
    hit=ok&(u>=0)&(w>=0)&(u+w<=1)
    z=V[:,0,ax]+u*(V[:,1,ax]-V[:,0,ax])+w*(V[:,2,ax]-V[:,0,ax])
    return int((hit&(z>p[ax])).sum())
  def __call__(s,p):
    p=np.asarray(p,float);return sum(s.count(p,ax)%2 for ax in range(3))>=2
  def hits(s,p,ax):   # all crossing coordinates along axis through p (for thickness)
    a,b=[q for q in range(3) if q!=ax];k=(int(np.floor(p[a]/s.cell)),int(np.floor(p[b]/s.cell)));ts=s.B[ax].get(k)
    if ts is None: return np.zeros(0)
    V=s.V[ts];A=V[:,0,[a,b]];Bv=V[:,1,[a,b]];C=V[:,2,[a,b]];q=np.array([p[a],p[b]])
    v0=Bv-A;v1=C-A;v2=q-A;den=v0[:,0]*v1[:,1]-v1[:,0]*v0[:,1];ok=np.abs(den)>1e-18;den=np.where(ok,den,1)
    u=(v2[:,0]*v1[:,1]-v1[:,0]*v2[:,1])/den;w=(v0[:,0]*v2[:,1]-v2[:,0]*v0[:,1])/den
    hit=ok&(u>=0)&(w>=0)&(u+w<=1);z=V[:,0,ax]+u*(V[:,1,ax]-V[:,0,ax])+w*(V[:,2,ax]-V[:,0,ax])
    return np.sort(z[hit])

def tri_samples(P,T,step=0.0005):
  V=P[T];L=np.linalg.norm(V[:,[1,2,0]]-V,axis=2).max(1);pts=[V.mean(1)]
  for t in range(len(T)):
    n=max(1,int(np.ceil(L[t]/step)))
    if n==1: continue
    i,j=np.meshgrid(np.arange(n+1),np.arange(n+1));m=(i+j)<=n;a=i[m]/n;b=j[m]/n
    pts.append(V[t,0]*(1-a-b)[:,None]+V[t,1]*a[:,None]+V[t,2]*b[:,None])
  return np.vstack(pts)

import numpy as np,time
from scipy import ndimage
G0=np.array([-0.085,1.525,-0.065]);GH=0.001;GN=np.array([171,196,221])
def build_grid():
  t=time.time();inside=np.zeros(GN,bool)
  xs=G0[0]+GH*(np.arange(GN[0])+0.5);ys=G0[1]+GH*(np.arange(GN[1])+0.5);zs=G0[2]+GH*(np.arange(GN[2])+0.5)
  for k in BRAIN:
    I=BI[k];m=np.zeros(GN,bool)
    for i,x in enumerate(xs):
      for j,z in enumerate(zs):
        h=I.hits([x,0,z],1)
        if len(h)<2: continue
        par=np.searchsorted(h,ys)%2==1
        m[i,:,j]=par
    inside|=m
  print('grid inside built %.1fs, inside voxels %d'%(time.time()-t,inside.sum()))
  dist=ndimage.distance_transform_edt(~inside)*GH
  return inside,dist
def vox(p): return np.clip(np.floor((np.asarray(p)-G0)/GH).astype(int),0,GN-1)
def cen(ijk): return G0+GH*(np.asarray(ijk)+0.5)

import heapq
NB=[(i,j,k) for i in (-1,0,1) for j in (-1,0,1) for k in (-1,0,1) if (i,j,k)!=(0,0,0)]
NBL=[np.sqrt(i*i+j*j+k*k) for i,j,k in NB]
def astar(a,b,cost,blocked,maxn=3000000):
  """cost: 每個體素的單位長度代價（>=1）；blocked: 不可走。a,b: 體素索引 tuple"""
  a=tuple(a);b=tuple(b);g={a:0.0};prev={};h=lambda q:np.sqrt(sum((q[i]-b[i])**2 for i in range(3)))
  pq=[(h(a),a)];n=0
  while pq:
    f,u=heapq.heappop(pq)
    if u==b: break
    n+=1
    if n>maxn: raise RuntimeError('A* too long')
    gu=g[u]
    for (di,dj,dk),L in zip(NB,NBL):
      v=(u[0]+di,u[1]+dj,u[2]+dk)
      if min(v)<0 or v[0]>=GN[0] or v[1]>=GN[1] or v[2]>=GN[2] or blocked[v]: continue
      nv=gu+L*0.5*(cost[u]+cost[v])
      if nv<g.get(v,1e18): g[v]=nv;prev[v]=u;heapq.heappush(pq,(nv+h(v),v))
  if b not in prev and a!=b: raise RuntimeError('no path')
  path=[b]
  while path[-1]!=a: path.append(prev[path[-1]])
  return np.array([cen(q) for q in path[::-1]])

from scipy.interpolate import RectBivariateSpline
from scipy.ndimage import gaussian_filter
def ray_all(P,T,o,d):
  v0=P[T[:,0]];e1=P[T[:,1]]-v0;e2=P[T[:,2]]-v0
  h=np.cross(d,e2);a=(e1*h).sum(1);ok=np.abs(a)>1e-14;f=np.where(ok,1/np.where(ok,a,1),0)
  s=o-v0;u=f*(s*h).sum(1);q=np.cross(s,e1);v=f*(q*d).sum(1);t=f*(e2*q).sum(1)
  m=ok&(u>=0)&(v>=0)&(u+v<=1)&(t>0);return np.sort(t[m])
class Patch:
  """皮質上的一小塊（示意微血管床）：S0＋u·e1＋v·e2 往 −n0 打射線，第一個交點＝軟腦膜面（高度 H），第二個交點＝灰質下緣（厚度 t）。座標 mm。"""
  def __init__(s,S0,n0,e1,U,Vv,step=0.25,lift=15.0,mesh_ids=None):
    s.S0=np.asarray(S0,float);s.n=unit(n0);e1=np.asarray(e1,float);e1=unit(e1-(e1@s.n)*s.n);s.e1=e1;s.e2=np.cross(s.n,e1)
    s.step=step;s.U=U;s.V=Vv;us=np.arange(-U-1,U+1+1e-9,step);vs=np.arange(-Vv-1,Vv+1+1e-9,step)
    ids=mesh_ids or BRAIN;Ps=[];Ts=[];o=0
    for k in ids:
      P,T=raw(k);c=P[T].mean(1);m=np.linalg.norm(c-s.S0,axis=1)<0.03
      if m.any(): Ps.append(P);Ts.append(T[m]+o);o+=len(P)
    P=np.vstack(Ps);T=np.vstack(Ts)
    H=np.full((len(us),len(vs)),np.nan);TH=np.full_like(H,np.nan)
    for i,u in enumerate(us):
      for j,v in enumerate(vs):
        org=s.S0+(u*s.e1+v*s.e2+lift*s.n)/1000;hs=ray_all(P,T,org,-s.n)
        if len(hs)>=2: H[i,j]=lift-hs[0]*1000;TH[i,j]=(hs[1]-hs[0])*1000
    s.ok=not np.isnan(H).any()
    s.Hraw=H;s.Traw=TH
    if s.ok:
      s.Hs=RectBivariateSpline(us,vs,gaussian_filter(H,1.5));s.Ts=RectBivariateSpline(us,vs,gaussian_filter(TH,1.5))
  def H(s,u,v): return float(s.Hs(u,v)[0,0])
  def t(s,u,v): return float(s.Ts(u,v)[0,0])
  def W(s,q):
    q=np.atleast_2d(q);out=[]
    for u,v,z in q: out.append(s.S0+(u*s.e1+v*s.e2+(s.H(u,v)-z)*s.n)/1000)
    return np.array(out)
  def score(s):
    if not s.ok: return None
    k=int(round(1/s.step));m=(slice(k,-k),slice(k,-k));H=s.Hraw[m];T=s.Traw[m]
    gy,gx=np.gradient(gaussian_filter(s.Hraw,1.5),0.25);sl=np.hypot(gx,gy)[m]
    return dict(tmin=float(T.min()),tmed=float(np.median(T)),slope=float(sl.max()),Hrange=float(H.max()-H.min()))

# ======================================================================================
# 腦部：組織細胞 場景
# ======================================================================================
import time
T_START=time.time()
def log(*a): print('[%5.1fs]'%(time.time()-T_START),*a,flush=True)
CV='cardiovascular.'
def hermite_path(pts,T0,T1,step=0.0012,tens=0.5):
  """分段三次 Hermite：兩端切線固定為 T0／T1（切線相接），中間點的切線用 Catmull-Rom（同 build_lung_centerlines.py）"""
  pts=[np.asarray(p,float) for p in pts];n=len(pts);T=[None]*n
  T[0]=unit(T0);T[-1]=unit(T1)
  for i in range(1,n-1): T[i]=unit(pts[i+1]-pts[i-1])
  out=[pts[0]]
  for i in range(n-1):
    a,b_=pts[i],pts[i+1];d=np.linalg.norm(b_-a);k=d*tens
    out.append(bez(a,a+T[i]*k*0.9,b_-T[i+1]*k*0.9,b_,max(6,int(d/step*2)))[1:])
  return resamp(np.vstack([out[0][None,:]]+out[1:]),step)
def gtaper(P,a,b):
  c=_cum(P);t=ss(c/c[-1])*0.6+0.4*(c/c[-1]);return a*(b/a)**t
def y_taper(R,P,frac=2**(-1/3),Lt=None):
  """Y 形分叉的母管：最後 Lt 公尺內半徑平滑收到子管起點半徑（同肺場景）"""
  R=np.asarray(R,float).copy();c=_cum(P);re_=float(R[-1])*frac;Lt=Lt or max(0.006,1.6*float(R[-1]));w=ss((c-(c[-1]-Lt))/Lt);return (1-w)*R+w*np.minimum(R,re_)
def y_widen(R,P,frac=2**(-1/3),Lt=None):
  """Y 形匯流的子管（鏡像）：起點半徑由（母管起點×2^(-1/3)）平滑放大到自己的半徑——這裡用在靜脈分流（上矢狀竇→左右橫竇）不需要"""
  return R
def _ma(r,w=7):
  r=np.asarray(r,float);h=w//2;q=np.r_[np.full(h,r[0]),r,np.full(h,r[-1])];return np.convolve(q,np.ones(w)/w,mode='valid')
def mono_dec(r,w=7): return np.minimum.accumulate(_ma(r,w))
def mono_inc(r,w=7): return np.maximum.accumulate(_ma(r,w))
from scipy.ndimage import gaussian_filter1d
def denoise(P,sigma,step=0.0005,keep=None):
  """網格中心線的小鋸齒：高斯平滑（sigma 公尺），兩端 keep 公尺內逐漸不動（保住接點位置與切線）"""
  P=resamp(np.asarray(P,float),step);c=_cum(P);keep=2*sigma if keep is None else keep
  G=gaussian_filter1d(P,sigma/step,axis=0,mode='nearest');w=(ss(c/max(keep,1e-6))*ss((c[-1]-c)/max(keep,1e-6)))[:,None] if keep>0 else np.ones((len(P),1))
  return (1-w)*P+w*G
def repel(P,R,obsP,obsR,fix0,fix1,clear=0.0004,iters=200):
  """把 P 中段推離障礙物（其他血管的中心線點），兩端 fix0／fix1 公尺內不動（同 build_lung_centerlines.py）"""
  P=np.asarray(P,float).copy();R=np.broadcast_to(np.asarray(R,float),(len(P),));c=_cum(P);w=ss((c-fix0)/0.012)*ss((c[-1]-fix1-c)/0.012)
  tr=cKDTree(obsP);obsR=np.asarray(obsR)
  for _ in range(iters):
    d,j=tr.query(P,k=6);need=R[:,None]+obsR[j]+clear;viol=need-d;k=np.argmax(viol,axis=1);v=viol[np.arange(len(P)),k];q=obsP[j[np.arange(len(P)),k]]
    if v.max()<=0: break
    dirn=P-q;dirn/=np.linalg.norm(dirn,axis=1)[:,None]+1e-12;disp=np.where(v[:,None]>0,dirn*v[:,None]*0.6,0)
    for _s in range(30): disp[1:-1]=0.25*disp[:-2]+0.5*disp[1:-1]+0.25*disp[2:]
    P=P+disp*w[:,None]*0.5
  return P
def interp_r(P,Pm,Rm):
  """把網格中心線 Pm 的半徑 Rm 依最近點對到新路徑 P"""
  j=cKDTree(Pm).query(P)[1];return np.asarray(Rm)[j]
def cap_after(R,P,r0,L=0.006):
  """起點半徑＝r0，之後不超過 r0（只會變細）、平滑過渡 L 公尺"""
  c=_cum(P);w=ss(c/L);R=np.minimum(np.asarray(R,float),r0);return (1-w)*r0+w*R
def ramp_to(R,P,r1,L=0.006):
  """終點半徑平滑到 r1"""
  c=_cum(P);w=ss((c-(c[-1]-L))/L);return (1-w)*np.asarray(R,float)+w*r1
def murray_after(R,P,s_b,r_child,L=0.006):
  """母管在分出點 s_b 之後依 Murray（r³＝Σ）扣掉子管"""
  R=np.asarray(R,float);c=_cum(P);w=ss((c-s_b+L/2)/L);ra=np.cbrt(np.maximum(R**3-r_child**3,(0.3*R)**3));return (1-w)*R+w*ra
def murray_add(R,P,s_j,r_child,L=0.004):
  """匯流：在匯入點 s_j 之後依 Murray 加上子管（只會變粗）"""
  R=np.asarray(R,float);c=_cum(P);w=ss((c-s_j+L/2)/L);return np.cbrt(R**3+w*r_child**3)

segs={}
def put(sid,pts,rad,kind,o2,src,schem=False,**kw):
  pts=np.asarray(pts,float);rad=np.broadcast_to(np.asarray(rad,dtype=float),(len(pts),)).copy()
  segs[sid]=dict(kind=kind,o2=o2,source=src,schematic=schem,points=pts,radius=rad,**kw)

# ---------------- 1. 網格中心線 ----------------
E={
 'asc':('ascending_aorta',[0.0195,1.3168,0.073],[0.0058,1.3606,0.0823]),'arch':('aortic_arch',[0.0058,1.3606,0.0823],[0.0193,1.3608,0.0204]),
 'desc':('thoracic_aorta',[0.0193,1.3608,0.0204],[0.0089,1.2082,0.0436]),'bct':('brachiocephalic_trunk',[0.0112,1.3836,0.0664],[-0.0148,1.4129,0.0699]),
 'rcca':('right_common_carotid_artery',[-0.0148,1.4129,0.0699],[-0.0312,1.4865,0.0536]),'lcca':('left_common_carotid_artery',[0.0166,1.3961,0.057],[0.0312,1.4865,0.0536]),
 'rsa':('right_subclavian_artery',[-0.0148,1.4129,0.0699],[-0.0796,1.4124,0.0506]),'lsa':('left_subclavian_artery',[0.0231,1.3894,0.0484],[0.0796,1.4124,0.0506]),
 'rica':('internal_carotid_artery_r',[-0.0312,1.4865,0.0536],[-0.0105,1.6036,0.0755]),'lica':('internal_carotid_artery_l',[0.0312,1.4865,0.0536],[0.0105,1.6036,0.0755]),
 'rva':('vertebral_artery_r',[-0.0411,1.4215,0.0522],[0.0,1.5789,0.0514]),'lva':('vertebral_artery_l',[0.0411,1.4215,0.0522],[0.0,1.5789,0.0514]),
 'ba':('basilar_artery',[0.0,1.5789,0.0514],[0.0,1.6023,0.062]),
 'rpcom':('posterior_communicating_artery_r',[-0.011,1.6057,0.075],[-0.0051,1.6067,0.0631]),'lpcom':('posterior_communicating_artery_l',[0.011,1.6057,0.075],[0.0051,1.6067,0.0631]),
 'raca':('anterior_cerebral_artery_r',[-0.0116,1.6065,0.0761],[-0.004,1.6196,0.0838]),'laca':('anterior_cerebral_artery_l',[0.0116,1.6065,0.0761],[0.004,1.6196,0.0838]),
 'rm1':('middle_cerebral_artery_m1_segment_r',[-0.0105,1.6036,0.0755],[-0.0374,1.6166,0.072]),'lm1':('middle_cerebral_artery_m1_segment_l',[0.0105,1.6036,0.0755],[0.0374,1.6166,0.072]),
 'rpca':('posterior_cerebral_artery_r',[0.0,1.6023,0.062],[-0.0272,1.5971,-0.0142]),'lpca':('posterior_cerebral_artery_l',[0.0,1.6023,0.062],[0.0272,1.5971,-0.0142]),
 'sss':('superior_sagittal_sinus',[0.0,1.6025,0.113],[0.0,1.5822,-0.0233]),
 'rts':('transverse_sinus_r',[0.0,1.5822,-0.0233],[-0.0595,1.5938,0.0145]),'lts':('transverse_sinus_l',[0.0,1.5822,-0.0233],[0.0595,1.5938,0.0145]),
 'rsig':('sigmoid_sinus_r',[-0.0595,1.5938,0.0145],[-0.0456,1.568,0.0319]),'lsig':('sigmoid_sinus_l',[0.0595,1.5938,0.0145],[0.0456,1.568,0.0319]),
 'rijv':('internal_jugular_vein_r',[-0.0391,1.5705,0.0349],[-0.0246,1.4126,0.0725]),'lijv':('internal_jugular_vein_l',[0.0391,1.5705,0.0349],[0.0246,1.4126,0.0725]),
 'rscv':('right_subclavian_vein',[-0.0933,1.4007,0.0558],[-0.0227,1.4017,0.073]),'lscv':('left_subclavian_vein',[0.0933,1.4007,0.0558],[0.0255,1.4119,0.0739]),
 'rbcv':('right_brachiocephalic_vein',[-0.0246,1.4126,0.0725],[-0.0144,1.3745,0.0767]),'lbcv':('left_brachiocephalic_vein',[0.0253,1.4128,0.074],[-0.0144,1.3745,0.0767]),
 'svc':('superior_vena_cava',[-0.0144,1.3745,0.0767],[-0.0166,1.3412,0.0715]),
}
MCL={}
import os,pickle
_CACHE=os.environ.get('BRAIN_CL_CACHE')
if _CACHE and os.path.exists(_CACHE): MCL=pickle.load(open(_CACHE,'rb'))
for k,(m,a,b) in E.items():
  if k in MCL: continue
  p,r,_=tube_cl(CV+m,a,b,step=0.0015);MCL[k]=(p,r)
def comp_cl(mid,a,b,step=0.0012):
  """網格有好幾個不相連的管（例：大腦中動脈 M2 段的兩條分支）：只取含終點 b 的那一塊，再做水平集中心線"""
  P,T=mesh(mid);G=graph(P,T);nc,lab=connected_components(G,directed=False)
  jb=int(np.argmin(np.linalg.norm(P-np.asarray(b),axis=1)));keep=lab==lab[jb];idx=np.where(keep)[0];re=-np.ones(len(P),int);re[idx]=np.arange(len(idx))
  Tm=T[keep[T].all(1)];key='_comp_'+mid+str(lab[jb]);_MC[key]=(P[idx],re[Tm]);D[key]={'P':[],'I':[]}
  return tube_cl(key,a,b,step=step)
for side,sg in (('l',1),('r',-1)):
  mid=CV+('insular_branches_of_middle_cerebral_artery_m2_segment_l' if side=='l' else 'insular_branches_of_middle_cerebral_artery_m2_r')
  for tag,e in (('a',[0.0484*sg,1.6249,0.0707]),('b',[0.0455*sg,1.6267,0.0729])):
    if side+'m2'+tag not in MCL: p,r,_=comp_cl(mid,[0.0374*sg,1.6166,0.072],e);MCL[side+'m2'+tag]=(p,r)
if _CACHE and not os.path.exists(_CACHE): pickle.dump(MCL,open(_CACHE,'wb'))
log('mesh centerlines',len(MCL))

# ---------------- 2. 腦的內外判斷、表面距離、自由空間格點 ----------------
BRAIN=['brain.frontal_lobe','brain.parietal_lobe','brain.temporal_lobe','brain.occipital_lobe','brain.other_cortex','brain.cerebellum','brain.brainstem']
BI={k:Inside(*raw(k)) for k in BRAIN}
SURF=np.vstack([tri_samples(*raw(k)) for k in BRAIN]);STREE=cKDTree(SURF)
BBX={k:(raw(k)[0].min(0)-1e-4,raw(k)[0].max(0)+1e-4) for k in BRAIN}
def in_brain(p):
  p=np.asarray(p,float);return any(BI[k](p) for k in BRAIN if (p>=BBX[k][0]).all() and (p<=BBX[k][1]).all())
def which(p): return [k for k in BRAIN if BI[k](p)]
INSIDE,DIST=build_grid();EXT=ndimage.label(~INSIDE)[0];EXT=EXT==EXT[0,0,0]
log('grid')

def push_out(P,R,fix0=0.002,fix1=0.002,clear=0.0003,iters=60,maxd=None,radial=None):
  """把路徑中段推出腦表面（腦網格外、離表面至少 管半徑＋clear）；兩端 fix0／fix1 公尺內不動；位移沿路平滑"""
  P=np.asarray(P,float).copy();R=np.broadcast_to(np.asarray(R,float),(len(P),));c=_cum(P);w=ss((c-fix0)/0.003)*ss((c[-1]-fix1-c)/0.003);tot=np.zeros(len(P))
  for it in range(iters):
    d,j=STREE.query(P);q=SURF[j];ins=np.array([in_brain(p) for p in P]);need=R+clear
    dirn=(P-q)/np.maximum(d,1e-9)[:,None];amt=np.where(ins,d+need,np.maximum(0,need-d));dirn[ins]*=-1
    if radial is not None: dirn=(P-radial)/np.linalg.norm(P-radial,axis=1)[:,None]   # 例：上矢狀竇在兩半球之間的上方，往「離腦中心」的方向推，不左右擺
    if (amt*w).max()<2e-6: break
    disp=dirn*amt[:,None]
    for _s in range(6): disp[1:-1]=0.25*disp[:-2]+0.5*disp[1:-1]+0.25*disp[2:]
    disp=disp*w[:,None];P=P+disp*0.8;tot+=np.linalg.norm(disp,axis=1)*0.8
  return P,float(tot.max())

def hug(P,R,iters=400,lam=0.35,clear=0.00035,fix=0.0015,fix1=None,ramp=0.002):
  """限制下的平滑：每一輪先做一次拉普拉斯平滑（磨圓），再把穿進腦或離腦表面太近的點直接推出去（不平滑位移）；反覆到收斂＝貼著腦表面、平順的路徑"""
  f1=fix if fix1 is None else fix1
  P=np.asarray(P,float).copy();R=np.broadcast_to(np.asarray(R,float),(len(P),));c=_cum(P);w=(ss((c-fix)/ramp)*ss((c[-1]-f1-c)/ramp)) if f1>0 else ss((c-fix)/ramp)
  for it in range(iters):
    Q=P.copy();Q[1:-1]=P[1:-1]+lam*w[1:-1,None]*(0.5*(P[:-2]+P[2:])-P[1:-1]);P=Q
    d,j=STREE.query(P);q=SURF[j];need=R+clear;near=d<need+0.0015
    ins=INSIDE[tuple(vox(P).T)].copy();ins[near]=[in_brain(p) for p in P[near]]   # 離表面遠的點用格點判斷，近的用精確射線
    dirn=(P-q)/np.maximum(d,1e-9)[:,None];dirn[ins]*=-1;amt=np.where(ins,d+need,np.maximum(0,need-d))*(w>0.02)
    P=P+dirn*amt[:,None]
    if it%40==39: P=resamp(P,float(np.mean(np.diff(_cum(P)))));c=_cum(P);w=(ss((c-fix)/ramp)*ss((c[-1]-f1-c)/ramp)) if f1>0 else ss((c-fix)/ramp);R=np.interp(c/c[-1],np.linspace(0,1,len(R)),R)
  return P
def pial_route(P0,T0,P1,T1,r0,r1,lead0=0.002,lead1=0.002,step=0.0005):
  """軟腦膜表面的血管（示意）：A* 在腦外的自由空間找路（偏好貼著腦表面 1～3 mm），再用「限制下的平滑」磨圓、貼著腦表面；兩端切線相接"""
  cost=1+6*np.clip((DIST-0.0018)/0.003,0,1.5)**2;blocked=INSIDE|(DIST<max(0.0008,r0+0.0004))   # 太窄的腦溝（放不下這條管）不走
  a=vox(np.asarray(P0)+unit(T0)*lead0);b=vox(np.asarray(P1)-unit(T1)*lead1);blocked=blocked.copy();blocked[tuple(a)]=False;blocked[tuple(b)]=False
  pth=astar(a,b,cost,blocked);pth=resamp(pth,0.001)
  for _ in range(10): pth[1:-1]=0.25*pth[:-2]+0.5*pth[1:-1]+0.25*pth[2:]
  n=len(pth);mids=[pth[i] for i in np.linspace(0,n-1,max(2,int(_cum(pth)[-1]/0.003))+1)[1:-1].round().astype(int)]
  mids=[q for q in mids if np.linalg.norm(q-P0)>0.006 and np.linalg.norm(q-P1)>0.005]   # 兩端各留幾 mm 給切線相接的轉彎
  P=hermite_path([np.asarray(P0)]+mids+[np.asarray(P1)],T0,T1,step=step)
  P0a=P.copy();P=hug(P,gtaper(P,r0,r1),fix=0.0008,ramp=0.007);P=resamp(P,step)   # 兩端只固定 0.8 mm、7 mm 內逐漸放開：接點切線不變，推開的位移分散，不會折角
  P=arrive(depart(P,T0,0.004),T1,0.003);P=resamp(P,step)   # 平滑後兩端再沿接點切線順回來（切線相接）
  mv=float(np.max(cKDTree(P).query(P0a)[0]))
  return P,gtaper(P,r0,r1),mv

def draw_from_wall(P,R,parentP,parentR,frac=0.8):
  """從母管中心線分出的子管：從中心線離母管中心 ≥ (母管半徑 − frac×子管半徑) 的地方才開始畫（開口落在母管壁上，母管裡看不到子管的管口）"""
  tr=cKDTree(parentP);d,j=tr.query(P);thr=np.asarray(parentR)[j]-frac*np.asarray(R)
  k=np.where(d>=thr)[0];i=int(k[0]) if len(k) else 0;c=_cum(P);return round(float(c[i]/c[-1]),4)   # tubeRange 是「弧長比例」（核心的 Path 依弧長重取樣）
def draw_to_wall(P,R,parentP,parentR,frac=0.8):
  u=draw_from_wall(np.asarray(P)[::-1],np.asarray(R)[::-1],parentP,parentR,frac);return round(1-u,4)
def best_branch(O,T,meshP,j0s,rr,ell=None):
  """母管中心線上的 O 點沿母管切線 T 離開，用 Hermite 曲線接上網格中心線第 j0 點（取曲率最好者）"""
  best=None
  for j0 in j0s:
    if j0>=len(meshP)-2: break
    g=hermite_path([O,meshP[j0]],T,tan_at(meshP,j0),step=0.0012);P=resamp(cat(g,meshP[j0+1:]),0.0012);P=smooth_path(P,passes=6,ramp=0.003)
    q=min_curv_ratio(P,np.full(len(P),rr))[0]
    if best is None or q>best[0]: best=(q,P,j0)
  return best[1],best[0]
def best_ysplit(O,T,meshP,j0s,rr,ell):
  """Y 形分叉的子管：從母管末端沿母管切線離開。兩種接法都試（depart：先沿母管切線走 ell 再慢慢轉回；Hermite：沿母管切線離開、
  以 Hermite 曲線接上網格中心線第 j0 點），取最小曲率半徑最大的（子管轉的角度大時 Hermite 較順，角度小時 depart 較順）"""
  best=None
  for j0 in j0s:
    if j0>=len(meshP)-2: break
    for e in (ell,1.5*ell):
      P=depart(spline([O]+list(meshP[j0:]),0.0012),T,e);q=min_curv_ratio(P,np.full(len(P),rr))[0]
      if best is None or q>best[0]: best=(q,P)
  P2,q2=best_branch(O,T,meshP,list(j0s)+list(range(max(j0s)+1,max(j0s)+8)),rr)
  return (P2,q2) if q2>best[0] else (best[1],best[0])
def best_ymerge(meshP,j1s,O,T,rr,ell):
  """Y 形匯流的子管：網格中心線第 j1 點起用 Hermite 曲線沿母管切線 T 併入 O（取曲率最好者）"""
  best=None
  for j1 in list(j1s)+list(range(min(j1s)-1,max(2,min(j1s)-8),-1)):
    if j1<2: continue
    g=hermite_path([meshP[j1],O],tan_at(meshP,j1),T,step=0.0012);P=resamp(cat(meshP[:j1+1],g),0.0012);P=smooth_path(P,passes=6,ramp=0.003)
    q=min_curv_ratio(P,np.full(len(P),rr))[0]
    if best is None or q>best[0]: best=(q,P,j1)
  return best[1],best[0]
def join_smooth(A,B,ramp=0.004):
  """同軸相接的兩段（例：頸總動脈→頸內動脈）：接起來順一次再切回兩段，接點切線連續"""
  P=resamp(cat(A,B),0.0012);j=int(np.argmin(np.linalg.norm(P-A[-1],axis=1)));Q=smooth_path(P,passes=8,ramp=ramp)
  return Q[:j+1],Q[j:]
CURV={}
# ---------------- 3. 動脈：主動脈、弓上分支、頸部 ----------------
asc,arch,desc=MCL['asc'][0],MCL['arch'][0],MCL['desc'][0]
ao=resamp(denoise(cat(asc,arch,desc),0.015,keep=0.0),0.0015)   # 主動脈半徑 12–14 mm：中心線要很平順，曲率半徑才會大於管半徑
aor=mono_dec(np.minimum(_ma(interp_r(ao,np.vstack([asc,arch,desc]),np.r_[MCL['asc'][1],MCL['arch'][1],MCL['desc'][1]]),15),14.0e-3),9)
cao=_cum(ao);s_of=lambda pt:float(cao[int(np.argmin(np.linalg.norm(ao-np.asarray(pt),axis=1)))])
S_BCT=s_of(MCL['bct'][0][0]);S_LCCA=s_of(MCL['lcca'][0][0]);S_LSA=s_of(MCL['lsa'][0][0])
log('branch s',S_BCT,S_LCCA,S_LSA)
def ao_at(s): return path_at(ao,cao,s),unit(path_at(ao,cao,s+0.003)-path_at(ao,cao,s-0.003)),float(np.interp(s,cao,aor))
# 頭臂動脈幹
O,T,rp=ao_at(S_BCT);bct,q=best_branch(O,T,MCL['bct'][0],range(3,16),5.5e-3);CURV['bct_join']=q
bct_r=cap_after(mono_dec(interp_r(bct,*MCL['bct'])),bct,5.6e-3);aor=murray_after(aor,ao,S_BCT,float(bct_r[0]))
# 左頸總動脈（主動脈在這裡切成兩段，追蹤的紅血球從 aorta 末端直接接 lcca）
O,T,rp=ao_at(S_LCCA);lcca,q=best_branch(O,T,MCL['lcca'][0],range(3,18),3.9e-3);CURV['lcca_join']=q
lcca_r=cap_after(mono_dec(interp_r(lcca,*MCL['lcca'])),lcca,3.9e-3);aor=murray_after(aor,ao,S_LCCA,float(lcca_r[0]))
O,T,rp=ao_at(S_LSA);lsa,q=best_branch(O,T,MCL['lsa'][0],range(3,18),3.3e-3);CURV['lsa_join']=q
lsa_r=cap_after(mono_dec(interp_r(lsa,*MCL['lsa'])),lsa,3.4e-3);aor=murray_after(aor,ao,S_LSA,float(lsa_r[0]))
i_l=int(np.argmin(np.abs(cao-S_LCCA)))
# 頭臂動脈幹末端 Y 形分成右頸總動脈、右鎖骨下動脈
bct_r=y_taper(bct_r,bct);rY=float(bct_r[-1]);Tb=unit(bct[-1]-bct[-4])
rcca,q=best_ysplit(bct[-1],Tb,MCL['rcca'][0],range(2,20),rY,0.012);CURV['rcca_y']=q
rsa,q=best_ysplit(bct[-1],Tb,MCL['rsa'][0],range(2,20),rY,0.012);CURV['rsa_y']=q
rcca_r=cap_after(interp_r(rcca,*MCL['rcca']),rcca,rY);rsa_r=cap_after(mono_dec(interp_r(rsa,*MCL['rsa'])),rsa,rY)
# 頸總動脈 → 頸內動脈（同軸延續；頸外動脈沒有畫）
rcca,rica=join_smooth(rcca,MCL['rica'][0]);lcca,lica=join_smooth(lcca,MCL['lica'][0])
rcca_r=np.interp(np.linspace(0,1,len(rcca)),np.linspace(0,1,len(rcca_r)),rcca_r);lcca_r=np.interp(np.linspace(0,1,len(lcca)),np.linspace(0,1,len(lcca_r)),lcca_r)
rcca_r=np.minimum.accumulate(rcca_r);lcca_r=np.minimum.accumulate(lcca_r)
def ica_r(P,mp,mr,r0): return cap_after(mono_dec(interp_r(P,mp,mr),11),P,r0)
rica_r=ica_r(rica,*MCL['rica'],float(rcca_r[-1]));lica_r=ica_r(lica,*MCL['lica'],float(lcca_r[-1]))
# 椎動脈：鎖骨下動脈的側支 → 左右椎動脈在腦幹前方匯成基底動脈（Y 形匯流）
ba=MCL['ba'][0];R_VA=1.1e-3;R_BA=float(np.cbrt(2*R_VA**3));Tba0=unit(ba[3]-ba[0])
vas={}
for side,parent,pr in (('r',rsa,rsa_r),('l',lsa,lsa_r)):
  mp=MCL[side+'va'][0];c=_cum(parent);j=int(np.argmin(np.linalg.norm(parent-mp[0],axis=1)));s_b=float(c[j]);O=parent[j];T=tan_at(parent,j)
  P,q=best_branch(O,T,mp,range(3,16),1.27e-3);CURV[side+'va_join']=q
  P2,q2=best_ymerge(P,range(len(P)-4,len(P)-14,-1),ba[0],Tba0,R_VA,0.008);CURV[side+'va_ymerge']=q2
  r=gtaper(P2,1.27e-3,R_VA);vas[side]=(P2,r,s_b)
  if side=='r': rsa_r=murray_after(rsa_r,rsa,s_b,1.27e-3)
  else: lsa_r=murray_after(lsa_r,lsa,s_b,1.27e-3)
ba_r=y_taper(np.full(len(ba),R_BA),ba);R_PCA0=float(ba_r[-1]);Tba1=unit(ba[-1]-ba[-4])
# ---------------- 4. 顱內動脈（網格中心線推離腦表面） ----------------
intra={}
for side,sg in (('r',-1),('l',1)):
  ica=rica if side=='r' else lica;icr=rica_r if side=='r' else lica_r
  icr=y_taper(icr,ica);rY=float(icr[-1]);Ti=unit(ica[-1]-ica[-4])
  if side=='r': rica_r=icr
  else: lica_r=icr
  aca,q=best_ysplit(ica[-1],Ti,MCL[side+'aca'][0],range(1,8),rY,0.004);CURV[side+'aca_y']=q
  m1,q=best_ysplit(ica[-1],Ti,MCL[side+'m1'][0],range(1,8),rY,0.004);CURV[side+'m1_y']=q
  aca_r=cap_after(mono_dec(interp_r(aca,*MCL[side+'aca'])),aca,rY);aca_r=ramp_to(aca_r,aca,0.7*float(aca_r[-1]),0.008)
  m1_r=np.full(len(m1),rY);m1_r=y_taper(m1_r,m1);r2=float(m1_r[-1]);T1=unit(m1[-1]-m1[-4])
  m2a,q=best_ysplit(m1[-1],T1,MCL[side+'m2a'][0],range(1,6),r2,0.004);CURV[side+'m2a_y']=q
  m2b,q=best_ysplit(m1[-1],T1,MCL[side+'m2b'][0],range(1,6),r2,0.004);CURV[side+'m2b_y']=q
  pca,q=best_ysplit(ba[-1],Tba1,MCL[side+'pca'][0],range(1,8),R_PCA0,0.004);CURV[side+'pca_y']=q
  pca_r=cap_after(mono_dec(interp_r(pca,*MCL[side+'pca']),9),pca,R_PCA0)
  out={}
  for nm,P,R in (('aca',aca,aca_r),('m1',m1,m1_r),('m2a',m2a,np.full(len(m2a),r2)),('m2b',m2b,np.full(len(m2b),r2)),('pca',pca,pca_r)):
    P1=resamp(denoise(P,0.0015 if nm.startswith('m2') else 0.0025 if nm=='pca' else 0.0012,keep=0.003 if not nm.startswith('m2') else 0.0012),0.0006);R1=interp_r(P1,P,R)   # 島葉支（M2）網格中心線末端有一小段急彎：平滑到接近末端
    P2=hug(P1,R1,iters=300,clear=0.0002,fix=0.004,fix1=0.0006) if nm=='pca' else P1;P2=resamp(P2,0.0008)   # 資料集的大腦後動脈有幾處淺淺穿進腦幹網格：用「限制下的平滑」推到腦外
    if nm=='m1':   # 資料集的大腦中動脈 M1 段夾在額葉與顳葉網格互相貼住的地方（沒有縫），推不出去：改用 A* 在腦外找一條起訖、切線都不變的路徑（示意，偏離網格中心線最多約 7 mm）
      P2,_r,_m=pial_route(P1[0],unit(P1[3]-P1[0]),P1[-1],unit(P1[-1]-P1[-4]),float(R1[0]),float(R1[-1]));P2=resamp(P2,0.0008)
      out[nm]=(P2,gtaper(P2,float(R1[0]),float(R1[-1])),_m);continue
    if nm=='aca':   # 大腦前動脈在資料集裡往兩半球之間的縫走，但腦網格在那裡互相貼住（沒有縫）：畫到還在腦外、離腦表面 ≥ 0.15 mm 的最後一點為止，末端收細（之後的分支沒有畫）
      dd_=STREE.query(P2)[0];Rr=interp_r(P2,P,R);ins_=np.array([in_brain(q) for q in P2]);cl_=np.where(ins_,-dd_,dd_)-Rr;bad=np.where(cl_<0.00015)[0];k_=int(bad[0]) if len(bad) else len(P2)
      P2=P2[:max(k_,8)];Rr=ramp_to(Rr[:len(P2)],P2,0.7*float(Rr[len(P2)-1]),0.004);out[nm]=(P2,Rr,0.0);continue
    out[nm]=(P2,interp_r(P2,P,R),float(np.max(cKDTree(P2).query(P1)[0])))
  intra[side]=out
log('arteries done')

# ---------------- 5. 皮質微血管床（示意） ----------------
def fillet(pts,rad,step=0.08):
  """參數空間（mm）的折線，每個轉角用二次 Bezier 圓角（半徑約 rad），再以 step 重取樣"""
  pts=[np.asarray(p,float) for p in pts];out=[pts[0]]
  for i in range(1,len(pts)-1):
    A_,C_,B_=pts[i-1],pts[i],pts[i+1];din=unit(C_-A_);dout=unit(B_-C_);th=np.arccos(np.clip(din@dout,-1,1))
    if th<1e-3: out.append(C_);continue
    Lc=min(rad*np.tan(th/2)*1.4,0.45*np.linalg.norm(C_-A_),0.45*np.linalg.norm(B_-C_));a=C_-din*Lc;b=C_+dout*Lc
    t=np.linspace(0,1,12)[:,None];q=(1-t)**2*a+2*(1-t)*t*C_+t*t*b;out.extend(list(q))
  out.append(pts[-1]);P=np.array(out)
  keep=[0]+[i for i in range(1,len(P)) if np.linalg.norm(P[i]-P[keep[-1] if False else i-1])>1e-9];P=P[keep]
  return resamp(P,step)
def find_site(guess,out_hint,feed,drain,U,Vv,rad=0.014,ncand=36,angs=range(-60,61,20)):
  """在 guess 附近的皮質表面找一塊平、厚的地方放示意微血管床；e1 大致由供血端指向引流端"""
  idx=STREE.query_ball_point(guess,rad);rng=np.random.RandomState(int(abs(guess[0])*1e5+guess[1]*1e3)%100000);idx=np.array(idx)[rng.permutation(len(idx))[:ncand*20]]
  cand=SURF[idx];cand=cand[np.argsort(np.linalg.norm(cand-guess,axis=1))];best=None;tried=0
  for S in cand:
    if tried>=ncand: break
    ns=SURF[STREE.query_ball_point(S,0.004)];c=ns-ns.mean(0);w,v=np.linalg.eigh(c.T@c);n0=v[:,0]*np.sign(v[:,0]@out_hint)
    o=S+n0*0.003
    if INSIDE[tuple(vox(o))] or not EXT[tuple(vox(o))] or in_brain(S+n0*0.0006) or not in_brain(S-n0*0.0008): continue
    tried+=1;a=np.asarray(drain,float)-np.asarray(feed,float);a=unit(a-(a@n0)*n0);b=np.cross(n0,a)
    for ang in angs:
      e1=np.cos(np.radians(ang))*a+np.sin(np.radians(ang))*b;pa=Patch(S,n0,e1,U,Vv,step=0.5);sc=pa.score()
      if not sc: continue
      s=sc['Hrange']+4*max(0,3.4-sc['tmin'])+0.15*sc['slope']+0.004*abs(ang)
      if best is None or s<best[0]: best=(s,S,n0,e1,sc)
  log('site',np.round(best[1],4).tolist(),{k:round(v,2) for k,v in best[4].items()})
  return best[1],best[2],best[3]
BEDS={}
def make_bed(B,S0,n0,e1,U,Vv,nA,rc,focus=False,tr_k=None):
  pa=Patch(S0,n0,e1,U,Vv,step=0.25);assert pa.ok,B
  tmin=float(np.nanmin(pa.Traw[4:-4,4:-4]));assert tmin>2.6,(B,tmin)
  vA,vV=-1.55,1.55;uA=np.linspace(-U+1.2,U-1.2,nA);uV=(uA[:-1]+uA[1:])/2;nV=nA-1
  zb=0.68*tmin;dU=0.36
  if focus: lay_r=[0.18,0.44];lay_l=[0.27,0.53]
  else: lay_r=[0.30];lay_l=[0.45]
  rcm=rc*1000   # mm
  # 每條小動脈分出去的微血管：右（→V_i）、左（→V_{i-1}）、底部 U 形（→V_i 底部同軸；最後一條→V_{n-1} 側面）
  caps=[]   # dict(id,a,v,kind,z1)
  for i in range(nA):
    for l,f in enumerate(lay_r):
      if i<nV: caps.append(dict(id=f'{B}c{i}r{l}',a=i,v=i,kind='mid',z1=f*tmin))
    for l,f in enumerate(lay_l):
      if i>0: caps.append(dict(id=f'{B}c{i}l{l}',a=i,v=i-1,kind='mid',z1=f*tmin))
    caps.append(dict(id=f'{B}u{i}',a=i,v=min(i,nV-1),kind='U' if i<nV else 'Uside',z1=zb))
  ncap=[sum(1 for c in caps if c['a']==i) for i in range(nA)]
  rA=[rc*n**(1/3) for n in ncap]
  rPA_in=float(np.cbrt(sum(r**3 for r in rA)));zPA=-(rPA_in*1000+0.30)
  nvj=[sum(1 for c in caps if c['v']==j) for j in range(nV)];rV=[rc*n**(1/3) for n in nvj];rPV_out=float(np.cbrt(sum(r**3 for r in rV)));zPV=-(rPV_out*1000+0.30)
  def Wz(q):
    q=np.atleast_2d(np.asarray(q,float));out=[]
    for u,v,z in q:
      tl=pa.t(u,v);z2=min(z,0.9*tl) if z>0 else z;out.append(pa.S0+(u*pa.e1+v*pa.e2+(pa.H(u,v)-z2)*pa.n)/1000)
    return resamp(np.array(out),0.0003) if len(out)>2 else np.array(out)
  bed=dict(name=B,patch=pa,tmin=tmin,segs=[],deep=[],pial=[])
  # 軟腦膜小動脈（床內一段）＋小動脈
  ub=[uA[i]-0.9 for i in range(nA)]
  pa_in=Wz(fillet([[-U-1.0,vA,zPA],[ub[-1],vA,zPA]],0.5))
  cpa=_cum(pa_in);s_b=[float(cpa[int(np.argmin(np.linalg.norm(pa_in-Wz([[ub[i],vA,zPA]])[0],axis=1)))]) for i in range(nA)]
  # 半徑：每過一個分出點，依 Murray 扣掉那條小動脈
  rpa=np.full(len(pa_in),rPA_in)
  for i in range(nA-1): rpa=murray_after(rpa,pa_in,s_b[i],rA[i],L=0.0006)
  rpa=ramp_to(rpa,pa_in,rA[-1],0.0006)
  arts={}
  for i in range(nA):
    P=Wz(fillet([[ub[i],vA,zPA],[uA[i],vA,zPA],[uA[i],vA,zb]],0.7));c=_cum(P)
    evs=sorted([float(c[int(np.argmin(np.linalg.norm(P-Wz([[uA[i],vA,cp['z1']]])[0],axis=1)))]) for cp in caps if cp['a']==i and cp['kind']=='mid'])
    r=np.full(len(P),rA[i]);m=ncap[i]
    for e in evs: m-=1;r=np.minimum(r,np.where(c>=e,rc*max(m,1)**(1/3),r));
    r=_ma(r,5);r[-1]=rc;arts[i]=(P,r)
  # 小靜脈
  vens={}
  for j in range(nV):
    P=Wz(fillet([[uV[j],vV,zb],[uV[j],vV,zPV],[uV[j]+0.9,vV,zPV]],0.7));c=_cum(P)
    evs=sorted([float(c[int(np.argmin(np.linalg.norm(P-Wz([[uV[j],vV,cp['z1']+dU-0.5 if cp['kind']=='mid' else zb-0.5]])[0],axis=1)))]) for cp in caps if cp['v']==j and cp['kind']!='U'])
    r=np.full(len(P),rc);m=1
    for e in evs: m+=1;r=np.maximum(r,np.where(c>=e,rc*m**(1/3),r))
    vens[j]=(P,_ma(r,5))
  # 軟腦膜小靜脈（床內一段）：V_0 的末端同軸接上，其後每條小靜脈從側面匯入
  pv_in=Wz(fillet([[uV[0]+0.9,vV,zPV],[U+1.0,vV,zPV]],0.5));cpv=_cum(pv_in);rpv=np.full(len(pv_in),rV[0])
  for j in range(1,nV):
    sj=float(cpv[int(np.argmin(np.linalg.norm(pv_in-vens[j][0][-1],axis=1)))]);rpv=murray_add(rpv,pv_in,sj,rV[j],L=0.0006)
  # 微血管
  capseg={}
  rng=np.random.RandomState(sum(map(ord,B))*7)
  for cp in caps:
    i,j=cp['a'],cp['v'];z1=cp['z1']
    if cp['kind']=='mid':
      zr=z1+dU;mid_u=0.5*(uA[i]+uV[j]);amp=rng.uniform(0.12,0.25)*(1 if rng.rand()<0.5 else -1)
      pts=[[uA[i],vA,z1],[uA[i],vA,zr],[mid_u+amp,-0.4,zr+0.06],[mid_u-amp*0.6,0.5,zr-0.04],[uV[j],vV,zr],[uV[j],vV,zr-0.5]]
    elif cp['kind']=='U':
      zr=zb+dU;pts=[[uA[i],vA,zb],[uA[i],vA,zr],[0.5*(uA[i]+uV[j]),0,zr+0.05],[uV[j],vV,zr],[uV[j],vV,zb]]
    else:
      zr=zb+dU;pts=[[uA[i],vA,zb],[uA[i],vA,zr],[0.5*(uA[i]+uV[j]),0,zr+0.05],[uV[j],vV,zr],[uV[j],vV,zb-0.5]]
    P=Wz(fillet(pts,0.32,0.05));c=_cum(P);r=rc*(1-0.06*np.sin(np.pi*c/c[-1]))
    capseg[cp['id']]=(P,r,cp)
  # 交叉的連通支（示意網，只畫管、不放血球）：同一深度層、相鄰兩條微血管的中段相連
  links={}
  if focus:
    k=0
    for grp in ((0,),(1,)):
      order=sorted([(0.5*(uA[cp['a']]+uV[cp['v']]),cid) for cid,(P,r,cp) in capseg.items() if cp['kind']=='mid' and int(cid[-1]) in grp])
      for pi,((ua,ca),(ub_,cb)) in enumerate(zip(order[:-1],order[1:])):
        Pa=capseg[ca][0];Pb=capseg[cb][0]
        for fr in ((0.32,0.66) if pi%2==0 else (0.42,0.74)):
          a_=Pa[int(fr*(len(Pa)-1))];b_=Pb[int(fr*(len(Pb)-1))]
          if np.linalg.norm(a_-b_)>0.0035 or np.linalg.norm(a_-b_)<0.0006: continue
          P=spline([a_,0.5*(a_+b_),b_],0.0002);links[f'{B}x{k}']=(P,np.full(len(P),rc*0.85));k+=1
  # 輸出成區段
  def addseg(sid,P,R,kind,o2,src,role,**kw):
    put(sid,P,R,kind,o2,src,True,capStart=False,capEnd=False,**kw);bed['segs'].append(sid)
  addseg(f'{B}pa_in',pa_in,rpa,'arteriole','rich','generated: schematic pial arteriole on the cortex surface (diameters enlarged)','pial');bed['pial'].append(f'{B}pa_in')
  for i,(P,r) in arts.items():
    u0=draw_from_wall(P,r,pa_in,rpa) if i<nA-1 else 0.0
    addseg(f'{B}a{i}',P,r,'arteriole','rich','generated: schematic penetrating arteriole (pial surface -> grey matter; enlarged)','art',tubeRange=[u0,1.0]);bed['deep'].append(f'{B}a{i}')
  for j,(P,r) in vens.items():
    u1=draw_to_wall(P,r,pv_in,rpv) if j>0 else 1.0
    addseg(f'{B}v{j}',P,r,'venule','poor','generated: schematic ascending venule (grey matter -> pial surface; enlarged)','ven',tubeRange=[0.0,u1]);bed['deep'].append(f'{B}v{j}')
  addseg(f'{B}pv_in',pv_in,rpv,'venule','poor','generated: schematic pial venule on the cortex surface (diameters enlarged)','pial');bed['pial'].append(f'{B}pv_in')
  for cid,(P,r,cp) in capseg.items():
    aP,aR=arts[cp['a']];vP,vR=vens[cp['v']]
    u0=draw_from_wall(P,r,aP,aR) if cp['kind']=='mid' else 0.0
    u1=draw_to_wall(P,r,vP,vR) if cp['kind'] in ('mid','Uside') else 1.0
    addseg(cid,P,r,'capillary','rich>poor','generated: schematic brain capillary in the grey matter (enlarged; real ~5-8 µm across)','cap',tubeRange=[u0,u1]);bed['deep'].append(cid)
  for lid,(P,r) in links.items():
    pa_=min(capseg.values(),key=lambda q:cKDTree(q[0]).query(P[0])[0]);pb_=min(capseg.values(),key=lambda q:cKDTree(q[0]).query(P[-1])[0])
    u0=draw_from_wall(P,r,pa_[0],pa_[1],0.3);u1=draw_to_wall(P,r,pb_[0],pb_[1],0.3)
    addseg(lid,P,r,'capillary','rich>poor','generated: schematic capillary cross-link (forms the net; drawn only, no flow)','link',tubeRange=[u0,u1]);bed['deep'].append(lid)
  bed.update(uA=uA,uV=uV,vA=vA,vV=vV,zPA=zPA,zPV=zPV,rPA_in=rPA_in,rPV_out=rPV_out,Wz=Wz,U=U,nA=nA,nV=nV,ncaps=len(capseg),nlinks=len(links),
    entry=pa_in[0],entryT=unit(pa_in[3]-pa_in[0]),exit=pv_in[-1],exitT=unit(pv_in[-1]-pv_in[-4]),center=pa.W([[0,0,0.4*tmin]])[0])
  BEDS[B]=bed;log('bed',B,'caps',len(capseg),'links',len(links),'tmin %.2f'%tmin,'rPA %.3f rPV %.3f mm'%(rPA_in*1000,rPV_out*1000))
  return bed

# ---------------- 6. 靜脈：硬腦膜靜脈竇 → 內頸靜脈 → 頭臂靜脈 → 上腔靜脈 ----------------
sss=MCL['sss'][0];sss_r=np.minimum(np.maximum.accumulate(np.maximum(_ma(MCL['sss'][1],9),0.6e-3)),2.0e-3)
sss,mv=push_out(sss,sss_r,fix0=0.0,fix1=0.004,clear=0.0003,radial=np.array([0.0,1.62,0.035]));log('sss pushed',round(mv*1000,2),'mm')
_n0=len(sss_r);sss=resamp(denoise(sss,0.006,keep=0.0),0.0015);sss_r=np.interp(np.linspace(0,1,len(sss)),np.linspace(0,1,_n0),sss_r)   # 末端（竇匯）的網格中心線有一小段鉤狀急彎：連末端一起平滑
VEINS={}
def sinus_side(side,sg):
  ts_m=MCL[side+'ts'][0];sig_m=MCL[side+'sig'][0];ijv_m=MCL[side+'ijv'][0]
  return ts_m,sig_m,ijv_m
# ---------------- 7. 微血管床（示意）與軟腦膜血管 ----------------
def frame_at(S,out_hint,ang,feed_dir):
  ns=SURF[STREE.query_ball_point(S,0.004)];c=ns-ns.mean(0);w,v=np.linalg.eigh(c.T@c);n0=v[:,0]*np.sign(v[:,0]@out_hint)
  a=np.asarray(feed_dir,float);a=unit(a-(a@n0)*n0);b=np.cross(n0,a);return n0,np.cos(np.radians(ang))*a+np.sin(np.radians(ang))*b
MIR=np.array([-1,1,1.0])
# 放大的床 F：左頂葉外側面（大腦中動脈的供血區）；e1＝往上的方向在切平面上轉 40°（量過最平、灰質最厚的方向，見 sources.md）
S_F=np.array([0.0673,1.652,0.03]);n_F,e_F=frame_at(S_F,[1,0,0],40,[0,1,0])
SPEC_F=dict(U=6.5,Vv=2.5,nA=7,rc=0.12e-3)
SPEC_B=dict(U=4.5,Vv=2.5,nA=4,rc=0.11e-3)
im=intra['l'];feedL_a=im['m2a'][0][-1];feedL_b=im['m2b'][0][-1];feedL_p=im['pca'][0][-1]
# B4：左額葉（上外側面）；位置與方向由 find_site 同樣的評分在額葉外側面掃描選出（最平、灰質最厚）
S4=np.array([0.0355,1.67,0.101]);n4,e4=frame_at(S4,[1,0.5,0.3],0,[0,1,0])
S2,n2,e2=find_site(np.array([0.030,1.618,-0.040]),[0.3,0,-1],feedL_p,MCL['lts'][0][len(MCL['lts'][0])//3],SPEC_B['U'],SPEC_B['Vv'])
SITES={'F':(S_F,n_F,e_F,SPEC_F,'lm2a','sss'),'B1':(S_F*MIR,n_F*MIR,e_F*MIR,SPEC_F|dict(nA=5,rc=0.11e-3),'rm2a','sss'),
       'B4':(S4,n4,e4,SPEC_B,'lm2b','sss'),'B5':(S4*MIR,n4*MIR,e4*MIR,SPEC_B,'rm2b','sss'),
       'B2':(S2,n2,e2,SPEC_B,'lpca','lts'),'B3':(S2*MIR,n2*MIR,e2*MIR,SPEC_B,'rpca','rts')}
for B,(S,n,e,sp,feed,drain) in SITES.items():
  make_bed(B,S,n,e,sp['U'],sp['Vv'],sp['nA'],sp['rc'],focus=(B=='F'))
# 供血：大腦中／後動脈末端 → 軟腦膜小動脈（A* 找路、貼著腦表面）→ 床的入口（切線相接）
FEEDP={}
for B,(S,n,e,sp,feed,drain) in SITES.items():
  side=feed[0];nm=feed[1:];P0,R0,_=intra[side][nm];T0=unit(P0[-1]-P0[-4]);bd=BEDS[B]
  P,R,mv=pial_route(P0[-1],T0,bd['entry'],bd['entryT'],float(R0[-1]),bd['rPA_in'])
  FEEDP[B]=(P,R);log('feed',B,'len mm',round(_cum(P)[-1]*1000,1),'moved',round(mv*1000,2))
# 動脈全部放進 segs
def putA(sid,P,R,src,schem=False,**kw): put(sid,P,R,'artery','rich',src,schem,capStart=False,capEnd=False,**kw)
aoA=ao[:i_l+1];aoD=ao[i_l:];aorA=aor[:i_l+1];aorD=aor[i_l:]
aorD=ramp_to(aorD,aoD,0.8*float(aorD[-1]),0.02)
putA('aorta',aoA,aorA,'mesh: ascending_aorta + aortic_arch up to the origin of the left common carotid artery (radius from the mesh, smoothed)')
putA('aorta_d',aoD,aorD,'mesh: rest of the aortic arch + thoracic aorta (drawn as background; free lower end)');segs['aorta_d']['capEnd']=True
putA('bct',bct,bct_r,'mesh: brachiocephalic_trunk (starts on the aortic centreline, drawn from the aortic wall)',tubeRange=[draw_from_wall(bct,bct_r,aoA,aorA),1.0])
putA('lcca',lcca,lcca_r,'mesh: left_common_carotid_artery',tubeRange=[draw_from_wall(lcca,lcca_r,aoD,aorD),1.0])
lsa_r=ramp_to(lsa_r,lsa,0.75*float(lsa_r[-1]),0.010);rsa_r=ramp_to(rsa_r,rsa,0.75*float(rsa_r[-1]),0.010)
putA('lsa',lsa,lsa_r,'mesh: left_subclavian_artery (free lateral end: continues to the arm, not drawn)',tubeRange=[draw_from_wall(lsa,lsa_r,aoD,aorD),1.0]);segs['lsa']['capEnd']=True
putA('rcca',rcca,rcca_r,'mesh: right_common_carotid_artery (Y-split from the brachiocephalic trunk)')
putA('rsa',rsa,rsa_r,'mesh: right_subclavian_artery (free lateral end)');segs['rsa']['capEnd']=True
putA('lica',lica,lica_r,'mesh: internal_carotid_artery_l (the external carotid artery is not drawn)');putA('rica',rica,rica_r,'mesh: internal_carotid_artery_r (the external carotid artery is not drawn)')
for side in 'lr':
  P,r,s_b=vas[side];par=lsa if side=='l' else rsa;parr=lsa_r if side=='l' else rsa_r
  putA(side+'va',P,r,'mesh: vertebral_artery (side branch of the subclavian artery; joins its partner to form the basilar artery)',tubeRange=[draw_from_wall(P,r,par,parr),1.0])
putA('ba',ba,ba_r,'mesh: basilar_artery')
for side in 'lr':
  for nm in ('aca','m1','m2a','m2b','pca'):
    P,R,mv=intra[side][nm];putA(side+nm,P,R,'mesh: %s (centreline from the mesh, pushed off the brain surface by up to %.1f mm)'%(nm,mv*1000))
  segs[side+'aca']['capEnd']=True   # 大腦前動脈：資料集只到前交通動脈附近，之後的分支沒有畫（游離末端，已收細）
for B,(P,R) in FEEDP.items(): putA(B+'pa',P,R,'generated: schematic cortical branch on the brain surface (path found outside the brain, hugging the surface; enlarged)',True)
# 後交通動脈、前交通動脈（只畫管，不放血球）
for side,sg in (('l',1),('r',-1)):
  ica=lica if side=='l' else rica;icr=lica_r if side=='l' else rica_r;pca=intra[side]['pca'][0];pcr=intra[side]['pca'][1]
  mp=MCL[side+'pcom'][0];c=_cum(ica);s=c[-1]-0.004;O=path_at(ica,c,s);T=unit(path_at(ica,c,s+0.002)-path_at(ica,c,s-0.002))
  jp=int(np.argmin(np.linalg.norm(pca-mp[-1],axis=1)));Q=pca[jp];Tq=tan_at(pca,jp);d_in=unit(Q-mp[len(mp)//2]);Tq=Tq if Tq@d_in>0 else -Tq
  P=hermite_path([O,mp[len(mp)//2],Q],T,Tq,step=0.0006);P=smooth_path(P,passes=4,ramp=0.002);r=np.full(len(P),0.70e-3)
  putA(side+'pcom',P,r,'mesh direction: posterior_communicating_artery (ICA -> PCA; drawn only, no flow)',tubeRange=[draw_from_wall(P,r,ica,icr),draw_to_wall(P,r,pca,pcr)])
Pa=raw(CV+'anterior_communicating_artery')[0];aL=intra['l']['aca'];aR=intra['r']['aca']
eL=Pa[np.argmax(Pa[:,0])];eR=Pa[np.argmin(Pa[:,0])];jL=int(np.argmin(np.linalg.norm(aL[0]-eL,axis=1)));jR=int(np.argmin(np.linalg.norm(aR[0]-eR,axis=1)))
QL,QR=aL[0][jL],aR[0][jR];dd=unit(QR-QL);P=hermite_path([QL,QR],dd,dd,step=0.0005);r=np.full(len(P),0.6e-3)
putA('acom',P,r,'mesh position: anterior_communicating_artery (joins the two ACAs; drawn only, no flow)',tubeRange=[draw_from_wall(P,r,aL[0],aL[1]),draw_to_wall(P,r,aR[0],aR[1])])
log('arteries put')
# ---------------- 8. 引流：床 → 軟腦膜小靜脈 → 腦靜脈（示意）→ 上矢狀竇／橫竇 ----------------
ts={};sig={};ijv={}
R_TS=float(sss_r[-1]*2**(-1/3))
sss_r=y_taper(sss_r,sss);Tsss=unit(sss[-1]-sss[-2])
for side in 'lr':
  P,q=best_ysplit(sss[-1],Tsss,MCL[side+'ts'][0],range(1,10),R_TS,0.006);CURV[side+'ts_y']=q
  P,mv=push_out(P,np.full(len(P),R_TS),fix0=0.004,fix1=0.001,clear=0.0002);ts[side]=resamp(denoise(P,0.003,keep=0.005),0.0012)
DRAINS={}
def drain_to(B,target):
  bd=BEDS[B];tg=sss if target=='sss' else ts[target[0]]
  j=int(np.argmin(np.linalg.norm(tg-bd['exit'],axis=1)));j=int(np.clip(j,6,len(tg)-6));Q=tg[j];Tq=tan_at(tg,j)
  P,R,mv=pial_route(bd['exit'],bd['exitT'],Q,Tq,bd['rPV_out'],0.55e-3,lead1=0.004)
  DRAINS[B]=(P,R,target,j);log('drain',B,'len mm',round(_cum(P)[-1]*1000,1),'moved',round(mv*1000,2))
for B,(S,n,e,sp,feed,drain) in SITES.items(): drain_to(B,drain)
# 竇的半徑：上矢狀竇依匯入的靜脈逐一變粗（Murray），橫竇在同側匯入後變粗
c=_cum(sss)
for B,(P,R,tgt,j) in DRAINS.items():
  if tgt=='sss': sss_r=murray_add(sss_r,sss,float(c[j]),float(R[-1]))
sss_r=np.maximum.accumulate(sss_r);sss_r=y_taper(sss_r,sss);R_TS=float(sss_r[-1]*2**(-1/3))
for side in 'lr':
  P=ts[side];r=gtaper(P,R_TS,1.75e-3);cc=_cum(P)
  for B,(Pd,Rd,tgt,j) in DRAINS.items():
    if tgt==side+'ts': r=murray_add(r,P,float(cc[j]),float(Rd[-1]))
  r=np.maximum.accumulate(r)
  P=P[:-3];r=r[:-3];Q=resamp(denoise(cat(P,MCL[side+'sig'][0][3:]),0.003,keep=0.003),0.0012);jq=int(np.argmin(np.linalg.norm(Q-P[-1],axis=1)))   # 橫竇末端與乙狀竇起端的網格中心線各有一小段急彎：各去掉約 3 mm 再接起來順過
  sg_,sgp=Q[:jq+1],Q[jq:]
  ts[side]=(sg_,np.interp(_cum(sg_)/_cum(sg_)[-1],_cum(P)/_cum(P)[-1],r))
  r_t=float(ts[side][1][-1])
  # 乙狀竇 → 內頸靜脈：資料集兩者之間有幾 mm 的空隙（頸靜脈孔），用切線相接的 Hermite 補上（示意）
  ijm=MCL[side+'ijv'][0];_j0=int(np.argmax(ijm[:,1]<sgp[-1][1]-0.005));ijm=ijm[_j0:]   # 資料集內頸靜脈的上端比乙狀竇下端還高：從低於乙狀竇末端 5 mm 的地方才接（不然補段要先往下再折回往上，會繞一圈）
  link=hermite_path([sgp[-1],ijm[0]],unit(sgp[-1]-sgp[-4]),unit(ijm[3]-ijm[0]),step=0.0012)
  sig[side]=(sgp,gtaper(sgp,r_t,1.9e-3))
  ij=resamp(denoise(cat(link,ijm[1:]),0.003,keep=0.004),0.0015);ijc=np.vstack([lcca,lica]) if side=='l' else np.vstack([rcca,rica]);ijcr=np.r_[lcca_r,lica_r] if side=='l' else np.r_[rcca_r,rica_r]
  ij=repel(ij,np.full(len(ij),3.0e-3),ijc,ijcr,0.012,0.006,clear=0.0012)   # 資料集的內頸靜脈網格在頸部和頸內動脈互相穿插：往外推開（示意）
  ijr=np.minimum(np.maximum(np.maximum.accumulate(_ma(interp_r(ij,*MCL[side+'ijv']),9)),1.9e-3),4.2e-3)   # 上限 4.2 mm：資料集內頸靜脈下端膨大到 4.9 mm，會和頸總動脈起端重疊
  ijv[side]=(ij,ijr,float(_cum(link)[-1]))
# 頭臂靜脈：內頸靜脈＋鎖骨下靜脈 匯成（Y 形匯流）；左右頭臂靜脈再匯成上腔靜脈
bcv={};scv={}
for side in 'lr':
  bm=resamp(denoise(MCL[side+'bcv'][0],0.005,keep=0.004),0.0015);B0=bm[0];Tb0=unit(bm[3]-bm[0])
  ij,ijr,_l=ijv[side];P,q=best_ymerge(ij,range(len(ij)-3,len(ij)-14,-1),B0,Tb0,float(ijr[-1]),0.008);CURV[side+'ijv_ymerge']=q
  ijv[side]=(P,np.interp(np.linspace(0,1,len(P)),np.linspace(0,1,len(ijr)),ijr),_l)
  sm=MCL[side+'scv'][0];sm=resamp(denoise(sm,0.003,keep=0.004),0.0015)
  P,q=best_ymerge(sm,range(len(sm)-2,len(sm)-26,-1),B0,Tb0,4.0e-3,0.018);CURV[side+'scv_ymerge']=q
  scv[side]=(P,gtaper(P,3.5e-3,4.0e-3))
  r0=float(np.cbrt(float(ijv[side][1][-1])**3+4.0e-3**3));bcv[side]=(bm,gtaper(bm,r0,7.0e-3))
svm=resamp(denoise(MCL['svc'][0],0.006,keep=0.0005),0.0015);S0v=svm[0];Ts0=unit(svm[3]-svm[0])
for side in 'lr':
  bm,br=bcv[side];P,q=best_ymerge(bm,range(len(bm)-2,len(bm)-16,-1),S0v,Ts0,float(br[-1]),0.012 if side=='l' else 0.008);CURV[side+'bcv_ymerge']=q
  bcv[side]=(P,np.interp(np.linspace(0,1,len(P)),np.linspace(0,1,len(br)),br))
R_SVC0=float(np.cbrt(2*7.0e-3**3));svr=gtaper(svm,R_SVC0,10.5e-3)
# 上腔靜脈畫到右心房壁為止（中心線上離右心房網格最近的點）
RAtree=cKDTree(mesh(CV+'right_atrium')[0]);cs=_cum(svm);dd=RAtree.query(svm)[0];win=np.where(cs>cs[-1]*0.4)[0];iw=int(win[np.argmin(dd[win])]);u_end=round(float(min(0.995,(cs[iw]+0.001)/cs[-1])),4)
def putV(sid,P,R,src,schem=False,**kw): put(sid,P,R,'vein','poor',src,schem,capStart=False,capEnd=False,**kw)
putV('sss',sss,sss_r,'mesh: superior_sagittal_sinus (centreline from the mesh, pushed off the brain; radius smoothed and made non-decreasing towards the confluence, enlarged where cerebral veins join)');segs['sss']['capStart']=True
for side in 'lr':
  putV(side+'ts',*ts[side],'mesh: transverse_sinus (Y-split from the superior sagittal sinus at the confluence)')
  putV(side+'sig',*sig[side],'mesh: sigmoid_sinus')
  P,R,ll=ijv[side];putV(side+'ijv',P,R,'mesh: internal_jugular_vein + generated %.0f mm link from the sigmoid sinus (gap at the jugular foramen in the dataset)'%(ll*1000))
  putV(side+'scv',*scv[side],'mesh: subclavian_vein (free lateral start: comes from the arm, not drawn)');segs[side+'scv']['capStart']=True
  putV(side+'bcv',*bcv[side],'mesh: brachiocephalic_vein')
putV('svc',svm,svr,'mesh: superior_vena_cava (drawn up to the right-atrial wall)',tubeRange=[0.0,u_end])
for B,(P,R,tgt,j) in DRAINS.items():
  tg=sss if tgt=='sss' else ts[tgt[0]][0];tr_=segs[tgt]['radius']
  putV(B+'pv',P,R,'generated: schematic cerebral vein on the brain surface -> dural venous sinus (path found outside the brain; enlarged)',True,tubeRange=[0.0,draw_to_wall(P,R,tg,tr_)])
log('veins put')
# ---------------- 9. 心腔內（不畫管，只給血球走） ----------------
lv_in=np.array([0.045,1.27,0.08]);lv_or=np.array([0.0121,1.3162,0.0779])
put('lv_out',cat(bez(lv_in,lv_in+np.array([-0.004,0.012,0]),lv_or+np.array([0.008,-0.010,0]),lv_or,16),line(lv_or,ao[0])),0.010,'chamber','rich','generated: left ventricle interior -> aortic orifice',True)
RA_C=np.asarray(raw(CV+'right_atrium')[0]).mean(0);RV_C=np.asarray(raw(CV+'right_ventricle')[0]).mean(0)
se=path_at(svm,cs,cs[iw]);put('ra_in',cat(line(se,se+Ts0*0.008),bez(se+Ts0*0.008,se+Ts0*0.016,RA_C+np.array([0,0.008,0]),RA_C,14)),0.009,'chamber','poor','generated: superior vena cava opening -> right atrium interior',True)
tv=0.5*(RA_C+RV_C)+np.array([0,-0.006,0.004]);put('ra_rv',cat(bez(RA_C,RA_C+np.array([0.004,-0.008,0.004]),tv-np.array([0.006,0,0]),tv,12),bez(tv,tv+np.array([0.006,0,0.002]),RV_C-np.array([0.006,0.004,0]),RV_C,12)),0.009,'chamber','poor','generated: right atrium -> tricuspid valve -> right ventricle interior',True)
log('chambers put; total segs',len(segs))

# ======================== 驗證 ========================
report={}
# (1) 微血管床：灰質裡的部分必須在腦網格內（奇偶射線法，3 軸多數決）；軟腦膜上的小血管在腦外、離表面 ≤ 1.5 mm
bad_in=[];bad_pial=[]
for B,bd in BEDS.items():
  n_in=0;n_tot=0
  for sid in bd['deep']:
    sg=segs[sid];P=sg['points'];c=_cum(P);m=np.ones(len(P),bool)
    if sid[len(B)]=='a': m=c>0.0018
    if sid[len(B)]=='v': m=c<c[-1]-0.0018
    for p in P[m]:
      n_tot+=1;ok=in_brain(p);n_in+=ok
      if not ok: bad_in.append(sid)
  pin=0;pt=0;dmax=0
  for sid in bd['pial']:
    P=segs[sid]['points'];d=STREE.query(P)[0]
    for p,dd_ in zip(P,d):
      pt+=1;ok=(not in_brain(p)) and dd_<0.0015;pin+=ok;dmax=max(dmax,dd_)
      if not ok: bad_pial.append(sid)
  report['bed_'+B]=dict(deep_points=n_tot,deep_inside_brain=n_in,pial_points=pt,pial_outside_and_near=pin,pial_max_surface_dist_mm=round(dmax*1000,2),capillaries=bd['ncaps'],links=bd['nlinks'],
    grey_matter_min_thickness_mm=round(bd['tmin'],2))
log('inside check',{k:(v['deep_inside_brain'],v['deep_points'],v['pial_outside_and_near'],v['pial_points']) for k,v in report.items()})
log('bad inside segs',sorted(set(bad_in))[:20],'bad pial',sorted(set(bad_pial))[:10])
# (2) 軟腦膜上的動脈、靜脈（供血／引流路徑）與顱內網格動脈：不可穿進腦
for sid in [B+t for B in BEDS for t in ('pa','pv')]+[s+n for s in 'lr' for n in ('aca','m1','m2a','m2b','pca')]:
  P=segs[sid]['points'];R=segs[sid]['radius'];d=STREE.query(P)[0];ins=np.array([in_brain(p) for p in P])
  u=segs[sid].get('tubeRange',[0,1]);cf=_cum(P)/_cum(P)[-1];a,b=int(np.searchsorted(cf,u[0])),int(np.searchsorted(cf,u[1],side='right'))
  report.setdefault(sid,{})['inside_brain_points']=int(ins[a:b].sum());report[sid]['min_clearance_mm']=round(float((d-R)[a:b][~ins[a:b]].min())*1000,2) if (~ins[a:b]).any() else None
log('pial/intracranial inside pts',{k:v.get('inside_brain_points') for k,v in report.items() if 'inside_brain_points' in v})

# ======================== 同軸相接的段合併成一條管 ========================
# 兩段同軸、同半徑相接時，兩根管的環在接點對不齊（各自的截面框架不同），半透明時看得到一圈接縫；
# 所以一路同軸延續的血管合成一段（例：左頸總動脈→頸內動脈→大腦中動脈→島葉支→腦表面小動脈），
# Y 形分叉／匯流的另一支改成「從母管中心線分出（或併入母管中心線）、從母管壁才開始畫」的側支。
PARTS={}
def chain(name,comps,kind,o2,src):
  Ps=[];Rs=[];meta=[]
  for cid in comps:
    sg=segs.pop(cid);p=np.asarray(sg['points'],float);r=np.asarray(sg['radius'],float)
    if Ps:
      g=np.linalg.norm(Ps[-1][-1]-p[0])
      if g>0.0006: log('!! chain gap',name,cid,round(g*1000,2),'mm')
      if g<1e-6: p=p[1:];r=r[1:]
    Ps.append(p);Rs.append(r);meta.append((cid,sg))
  P=np.vstack(Ps);R=np.concatenate(Rs);c=_cum(P);L=c[-1];bounds={};k=0
  for (cid,sg),p in zip(meta,Ps):
    s0=float(c[k]);k+=len(p);s1=float(c[k-1]);bounds[cid]=[round(s0/L,4),round(s1/L,4)]
  # 接點兩邊半徑不同（Y 形匯流後母管依 Murray 變粗）：接點前後各 L 公尺內平滑過渡
  k=0
  for p in Ps[:-1]:
    k+=len(p);j=k;Lb=max(0.003,3*float(max(R[j-1],R[j])))
    if abs(R[j]-R[j-1])>0.02*R[j]:
      a_=float(R[j-1]);b_=float(np.interp(c[j]+2*Lb,c,R));m=(c>=c[j])&(c<c[j]+2*Lb);R[m]=a_+(b_-a_)*ss((c[m]-c[j])/(2*Lb))   # 只在接點之後（母管那一側）過渡，子管不先變粗
  first=meta[0][1];last=meta[-1][1];tr0=first.get('tubeRange',[0,1])[0];tr1=last.get('tubeRange',[0,1])[1]
  u0=float(bounds[meta[0][0]][0]+tr0*(bounds[meta[0][0]][1]-bounds[meta[0][0]][0]));u1=float(bounds[meta[-1][0]][0]+tr1*(bounds[meta[-1][0]][1]-bounds[meta[-1][0]][0]))
  segs[name]=dict(kind=kind,o2=o2,source=src+' ['+' + '.join(m[0] for m in meta)+']',schematic=any(m[1]['schematic'] for m in meta),points=P,radius=R,
    capStart=first.get('capStart',True),capEnd=last.get('capEnd',True),tubeRange=[round(u0,4),round(u1,4)])
  PARTS[name]=bounds;return name
def side_from(sid,parent,frac=0.8):
  sg=segs[sid];u=sg.get('tubeRange',[0,1]);sg['tubeRange']=[draw_from_wall(sg['points'],sg['radius'],segs[parent]['points'],segs[parent]['radius'],frac),u[1]]
def side_to(sid,parent,frac=0.8):
  sg=segs[sid];u=sg.get('tubeRange',[0,1]);sg['tubeRange']=[u[0],draw_to_wall(sg['points'],sg['radius'],segs[parent]['points'],segs[parent]['radius'],frac)]
# 追蹤用（不畫管）：左心室 → 主動脈到左頸總動脈起點
_aotr=cat(segs['lv_out']['points'],segs['aorta']['points']);put('ao_tr',_aotr,np.r_[np.full(len(_aotr)-len(segs['aorta']['points']),0.010),segs['aorta']['radius']],'chamber','rich','tracer-only: left ventricle -> aortic arch at the origin of the left common carotid artery (not drawn)',True)
chain('aorta',['aorta','aorta_d'],'artery','rich','mesh: ascending aorta + aortic arch + thoracic aorta')
chain('lcar',['lcca','lica','lm1','lm2a','Fpa','Fpa_in'],'artery','rich','left common carotid -> internal carotid -> middle cerebral (M1, insular branch) -> schematic cortical branch -> pial arteriole of bed F')
chain('rcar',['bct','rcca','rica','rm1','rm2a','B1pa','B1pa_in'],'artery','rich','brachiocephalic trunk -> right common carotid -> internal carotid -> middle cerebral -> schematic cortical branch of bed B1')
chain('rvb',['rva','ba','rpca','B3pa','B3pa_in'],'artery','rich','right vertebral -> basilar -> right posterior cerebral -> schematic cortical branch of bed B3')
chain('lpcab',['lpca','B2pa','B2pa_in'],'artery','rich','left posterior cerebral (side branch at the basilar tip) -> schematic cortical branch of bed B2')
chain('lmca2',['lm2b','B4pa','B4pa_in'],'artery','rich','left middle cerebral insular branch (2nd) -> schematic cortical branch of bed B4')
chain('rmca2',['rm2b','B5pa','B5pa_in'],'artery','rich','right middle cerebral insular branch (2nd) -> schematic cortical branch of bed B5')
for B in BEDS: chain(B+'pv',[B+'pv_in',B+'pv'],'vein','poor','pial venule of bed '+B+' -> schematic cerebral vein -> dural sinus')
chain('rdrain',['sss','rts','rsig','rijv','rbcv','svc'],'vein','poor','superior sagittal sinus -> right transverse -> right sigmoid sinus -> (link) -> right internal jugular -> right brachiocephalic -> superior vena cava')
chain('ldrain',['lts','lsig','lijv','lbcv'],'vein','poor','left transverse (side branch at the confluence) -> left sigmoid sinus -> (link) -> left internal jugular -> left brachiocephalic')
def smooth_joint(name,s0,sigma,half,step=0.0006):
  """合併段在接點附近的小折角：接點前後 half 公尺內做高斯平滑（中間最強、兩邊漸弱），半徑跟著弧長重取樣"""
  sg=segs[name];P=np.asarray(sg['points'],float);R=np.asarray(sg['radius'],float);c=_cum(P);L=c[-1]
  P2=resamp(P,step);c2=_cum(P2);R2=np.interp(c2/c2[-1],c/L,R)
  G=gaussian_filter1d(P2,sigma/step,axis=0,mode='nearest');w=(1-ss(np.abs(c2-s0*c2[-1]/L)/half))[:,None];P3=P2+w*(G-P2);c3=_cum(P3);P4=resamp(P3,step);sg['points']=P4;sg['radius']=np.interp(_cum(P4)/_cum(P4)[-1],c3/c3[-1],R2)
for nm_,cp_ in (('rdrain','rbcv'),('rdrain','svc')): smooth_joint(nm_,PARTS[nm_][cp_][0]*_cum(segs[nm_]['points'])[-1],0.006,0.022)   # 內頸靜脈→頭臂靜脈→上腔靜脈
for nm_,cp_ in (('lcar','lm1'),('rcar','rm1')): smooth_joint(nm_,PARTS[nm_][cp_][0]*_cum(segs[nm_]['points'])[-1],0.003,0.010)   # 頸內動脈末端分出大腦中動脈（T 形）
smooth_joint('rdrain',0.5*(PARTS['rdrain']['svc'][0]+1.0)*_cum(segs['rdrain']['points'])[-1],0.008,0.03)   # 上腔靜脈整段
smooth_joint('rdrain',PARTS['rdrain']['rts'][0]*_cum(segs['rdrain']['points'])[-1],0.003,0.010)   # 上矢狀竇→右橫竇（竇匯）
for nm_,cp_ in (('lcar','Fpa'),('rcar','B1pa'),('lmca2','B4pa'),('rmca2','B5pa'),('lpcab','B2pa'),('rvb','B3pa')): smooth_joint(nm_,PARTS[nm_][cp_][0]*_cum(segs[nm_]['points'])[-1],0.0015,0.005)   # 腦底動脈→腦表面小動脈的接點
def hug_window(P,R,s0,s1,ramp=0.008,iters=400,lam=0.3,clear=0.0002):
  """只在弧長 s0～s1（公尺）之間做「限制下的平滑」，兩邊 ramp 內漸弱：把貼著腦幹的椎動脈末段、基底動脈推到腦外"""
  P=np.asarray(P,float).copy();R=np.asarray(R,float)
  for it in range(iters):
    c=_cum(P);w=ss((c-s0)/ramp)*ss((s1-c)/ramp)
    Q=P.copy();Q[1:-1]=P[1:-1]+lam*w[1:-1,None]*(0.5*(P[:-2]+P[2:])-P[1:-1]);P=Q
    m=w>0.02;d,j=STREE.query(P[m]);q=SURF[j];need=R[m]+clear;ins=np.array([in_brain(x) for x in P[m]])
    dirn=(P[m]-q)/np.maximum(d,1e-9)[:,None];dirn[ins]*=-1;amt=np.where(ins,d+need,np.maximum(0,need-d))*w[m]
    P[m]=P[m]+dirn*amt[:,None]
    if it%50==49:
      c0=_cum(P);P2=resamp(P,float(np.mean(np.diff(c0))));R=np.interp(_cum(P2)/_cum(P2)[-1],c0/c0[-1],R);P=P2
  return P,R
def move_end(sid,new,which,L=0.010):
  """側支末端（或起端）跟著母管移動：位移在 L 公尺內漸弱"""
  sg=segs[sid];P=np.asarray(sg['points'],float);c=_cum(P)
  if which=='end': d=new-P[-1];w=ss((c-(c[-1]-L))/L)
  else: d=new-P[0];w=1-ss(c/L)
  sg['points']=P+w[:,None]*d[None,:]
_sg=segs['rvb'];_c=_cum(_sg['points']);_L=_c[-1];_old_s=_sg['points'][int(np.argmin(np.abs(_c-PARTS['rvb']['ba'][0]*_L)))].copy();_old_e=_sg['points'][int(np.argmin(np.abs(_c-PARTS['rvb']['ba'][1]*_L)))].copy()
_P,_R=hug_window(_sg['points'],_sg['radius'],(PARTS['rvb']['rva'][1]*_L)-0.03,PARTS['rvb']['rpca'][0]*_L+0.004)   # 椎動脈最後 30 mm＋基底動脈：資料集貼著（部分穿進）腦幹網格
_sg['points'],_sg['radius']=_P,_R;_tr=cKDTree(_P)
move_end('lva',_P[_tr.query(segs['lva']['points'][-1])[1]],'end');move_end('lpcab',_P[_tr.query(segs['lpcab']['points'][0])[1]],'start')
# 大腦後動脈中段、第二條島葉支接腦表面小動脈處：管壁還略為碰到腦（中心線在腦外）：同樣在局部推開
for _sid,_cp,_a,_b in (('rvb','rpca',0.012,0.034),('lpcab','lpca',0.012,0.036),('lmca2','B4pa',-0.004,0.006),('rmca2','B5pa',-0.004,0.006)):
  _sg=segs[_sid];_c=_cum(_sg['points']);_s=PARTS[_sid][_cp][0]*_c[-1];_sg['points'],_sg['radius']=hug_window(_sg['points'],_sg['radius'],_s+_a,_s+_b,ramp=0.005,clear=0.00025)
def shrink_tight(sid,u0,look=0.008,minr=0.00015,gap=0.00008):
  """很窄的縫（大腦後動脈繞過中腦旁、夾在腦幹與顳葉之間）推不開：從弧長比例 u0 起，管半徑縮到不碰腦（離腦表面 ≥ gap），
  半徑只會變細（單調）、提早 look 公尺開始漸細，標示意"""
  sg=segs[sid];P=np.asarray(sg['points'],float);R=np.asarray(sg['radius'],float).copy();c=_cum(P);m=c>=u0*c[-1]
  d=STREE.query(P)[0];tg=R.copy();tg[m]=np.minimum(R[m],np.maximum(minr,d[m]-gap))
  k=max(1,int(look/np.mean(np.diff(c))));la=np.array([tg[i:i+k+1].min() for i in range(len(tg))])
  i0=int(np.argmax(m));R2=R.copy();R2[i0:]=np.minimum.accumulate(np.minimum(R[i0:],la[i0:]))
  R2=np.minimum(R2,_ma(R2,max(3,k|1)));R2[i0:]=np.minimum.accumulate(R2[i0:]);sg['radius']=R2
  return float(R2[i0:].min())
# （試過 shrink_tight 讓大腦後動脈縮到不碰腦：要縮到 0.14 mm，下游也只能更細，接不上床的小動脈，所以不用；大腦後動脈管壁仍碰到腦約 0.5–0.7 mm，中心線在腦外）
# 側支：從母管中心線分出，從母管壁才開始畫；併入母管中心線的，畫到母管壁為止
side_from('rsa','rcar');side_from('laca','lcar');side_from('raca','rcar');side_from('lmca2','lcar');side_from('rmca2','rcar');side_from('lpcab','rvb')
side_from('ldrain','rdrain');side_to('ldrain','rdrain');side_to('lva','rvb');side_to('lscv','ldrain');side_to('rscv','rdrain')
segs['ldrain']['capStart']=False;segs['ldrain']['capEnd']=False
for k_,sg in segs.items():
  if sg['kind'] in ('capillary','arteriole','venule'): sg['step']=0.0002
  elif sg['kind']!='chamber' and float(np.max(sg['radius']))<0.0012: sg['step']=0.0004
for B in BEDS:   # 床內小動脈與小靜脈的母管改名後，側支的 tubeRange 照舊（母管的點沒有變）
  pass
log('chained; segments',len(segs))
# (2b) 合併、平滑之後再查一次：顱內動脈（畫出來的範圍）不可穿進腦
for sid in ('lcar','rcar','rvb','lpcab','lmca2','rmca2','laca','raca','lpcom','rpcom','acom'):
  sg=segs[sid];P=np.asarray(sg['points']);R=np.asarray(sg['radius']);u=sg.get('tubeRange',[0,1]);cf=_cum(P)/_cum(P)[-1];m=(cf>=u[0])&(cf<=u[1])&(P[:,1]>1.53)
  d=STREE.query(P[m])[0];ins=np.array([in_brain(q) for q in P[m]]);cl=np.where(ins,-d,d)-R[m]
  report.setdefault(sid,{}).update(post_inside_brain_points=int(ins.sum()),post_min_wall_clearance_mm=round(float(cl.min())*1000,2) if len(cl) else None)
log('post-chain intracranial',{k:(report[k]['post_inside_brain_points'],report[k]['post_min_wall_clearance_mm']) for k in ('lcar','rcar','rvb','lpcab','lmca2','rmca2','laca','raca','lpcom','rpcom','acom')})
def drawn(sid):
  sg=segs[sid];p=np.asarray(sg['points']);r=np.asarray(sg['radius']);u=sg.get('tubeRange',[0,1]);c=_cum(p);f=c/c[-1];m=(f>=u[0]-1e-9)&(f<=u[1]+1e-9);return p[m],r[m]
# (3) 曲率（曲率半徑÷管半徑）
for sid,sg in segs.items():
  if sg['kind']=='chamber': continue
  P_,R_=drawn(sid)
  if len(P_)<4: continue
  q,i=min_curv_ratio(P_,R_);report.setdefault(sid,{})['min_curv_over_r']=round(q,2)   # 只算畫出來的範圍（tubeRange 外、藏在母管裡的轉彎不算）
mc=sorted((v['min_curv_over_r'],k) for k,v in report.items() if 'min_curv_over_r' in v)
log('min curvature/r lowest 16',mc[:16])
report['_junction_curvature']={k:round(v,2) for k,v in CURV.items()}
# (4) 畫出來的管不可互相穿過（相連的兩段在接點附近不算）
drw=[k for k in segs if segs[k]['kind']!='chamber']
D_={k:drawn(k) for k in drw};TR_={k:cKDTree(D_[k][0]) for k in drw};BB={k:(D_[k][0].min(0)-D_[k][1].max()-1e-3,D_[k][0].max(0)+D_[k][1].max()+1e-3) for k in drw}
FULLP={k:cKDTree(np.asarray(segs[k]['points'])) for k in drw}
overl=[]
for i,a in enumerate(drw):
  pa_,ra=D_[a]
  for b_ in drw[i+1:]:
    if (BB[a][0]>BB[b_][1]).any() or (BB[b_][0]>BB[a][1]).any(): continue
    pb,rb=D_[b_];d,j=TR_[b_].query(pa_);gap=d-ra-rb[j]
    if gap.min()>=0: continue
    # 接點：一段的端點落在另一段（完整中心線）上或附近
    pA=np.asarray(segs[a]['points']);pB=np.asarray(segs[b_]['points']);rr=max(ra.max(),rb.max())
    ends=[e for e in (pA[0],pA[-1]) if FULLP[b_].query(e)[0]<2.5*rr+1e-4]+[e for e in (pB[0],pB[-1]) if FULLP[a].query(e)[0]<2.5*rr+1e-4]
    m=gap<0;ex=max(0.0012,6*rr) if rr<0.001 else max(0.025,4*rr)
    for e in ends: m&=np.linalg.norm(pa_-e,axis=1)>ex
    if m.any(): overl.append((round(float(gap[m].min())*1000,3),a,b_,int(m.sum())))
log('OVERLAP (not at junctions):',len(overl),sorted(overl)[:25])
report['_overlap_not_at_junctions']=[list(x) for x in overl]
# ======================== 輸出 ========================
fb=BEDS['F'];pa=fb['patch']
named=dict(focus='F',focus_center=np.round(fb['center'],5).tolist(),focus_axes=dict(e1=np.round(pa.e1,4).tolist(),e2=np.round(pa.e2,4).tolist(),n=np.round(pa.n,4).tolist()),
  focus_tracer=['ao_tr','lcar','Fa%d'%(fb['nA']-1),'Fu%d'%(fb['nA']-1),'Fv%d'%(fb['nV']-1),'Fpv','rdrain','ra_in','ra_rv'],
  beds={B:dict(center=np.round(b['center'],5).tolist(),feed=SITES[B][4],drain=SITES[B][5],n_arterioles=b['nA'],n_venules=b['nV'],capillaries=b['ncaps'],links=b['nlinks']) for B,b in BEDS.items()},
  parts=PARTS,aortic_branch_s=dict(bct=round(S_BCT,4),lcca=round(S_LCCA,4),lsa=round(S_LSA,4)),ra_center=np.round(RA_C,5).tolist(),rv_center=np.round(RV_C,5).tolist())
def seg_out(v):
  o=dict(kind=v['kind'],o2=v['o2'],source=v['source'],schematic=v['schematic'],points=np.round(v['points'],5 if v['kind'] not in ('capillary','arteriole','venule') else 6).tolist(),radius=np.round(v['radius'],6).tolist())
  if 'radius_mesh' in v: o['radius_mesh']=np.round(np.asarray(v['radius_mesh']),5).tolist()
  if 'tubeRange' in v and list(v['tubeRange'])!=[0,1] and list(v['tubeRange'])!=[0.0,1.0]: o['tubeRange']=[float(x) for x in v['tubeRange']]
  if v.get('capStart') is False: o['capStart']=False
  if v.get('capEnd') is False: o['capEnd']=False
  if v.get('step'): o['step']=v['step']
  return o
for k in ('lica','rica','lva','rva','ba','lcca','rcca','bct','lsa','rsa','sss','lijv','rijv','lbcv','rbcv','svc'):
  pass
out=dict(version='brain_centerlines_v1',units='m',axes='+X body left, +Y up, +Z anterior (same as brain_scene_v1.glb)',generator='tools/anatomy/build_brain_centerlines.py',
 note='mesh: centreline and radius estimated from the glb meshes (aorta, arch branches, carotid/vertebral/basilar/cerebral arteries, dural sinuses, jugular/subclavian/brachiocephalic veins, SVC); radii smoothed and made monotone (see sources.md). generated (schematic=true): cortical branches and cerebral veins on the brain surface, the six capillary beds in the grey matter (penetrating arterioles, capillaries, cross-links, ascending venules), the sigmoid-to-jugular link and the chamber paths. Calibres of the small vessels are greatly enlarged.',
 validation=dict(method='grey-matter points of the capillary beds inside the brain meshes (odd-parity rays along x/y/z, majority vote); pial vessels outside the brain and within 1.5 mm of its surface; routes and intracranial mesh arteries pushed outside the brain; min curvature radius / tube radius; drawn tubes that are not joined must not intersect (centreline distance >= r1+r2)',results=report),
 named=named,segments={k:seg_out(v) for k,v in segs.items()})
json.dump(out,open(sys.argv[2],'w'),separators=(',',':'),default=lambda x:x.item() if hasattr(x,'item') else str(x))
if os.environ.get('BRAIN_DEBUG'): pickle.dump(dict(segs=segs,beds={k:{kk:vv for kk,vv in v.items() if kk not in ('patch','Wz')} for k,v in BEDS.items()}),open(os.environ['BRAIN_DEBUG'],'wb'))
log('wrote',sys.argv[2],'segments',len(segs))

# 血管接點整理（老師 2026-11-23：不要錐形殘端、半徑要連續漸變；規則見 tools/anatomy/polish_vessels.py 檔頭）
import os as _os, sys as _sys
_sys.path.insert(0, _os.path.dirname(_os.path.abspath(__file__)))
import polish_vessels as _pv
_pv.polish_path(sys.argv[2])
