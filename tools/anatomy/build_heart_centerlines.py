#!/usr/bin/env python3
"""build_heart_centerlines.py -- 「心臟：冠狀循環」場景的血管中心線：從 si_scene_v1.glb 的網格估出左、右冠狀動脈與各級分支、升主動脈，
並產生資料集沒有的部分（末端小動脈、心肌微血管床、小靜脈、伴行的心靜脈、冠狀竇）與只給血球走的路徑。

用法（在 repo 根目錄）：
  node tools/anatomy/dump_glb_world.mjs assets/biology/anatomy3d/si_scene_v1.glb /tmp/si_world.json --modules /tmp/gl/node_modules
  python3 tools/anatomy/build_heart_centerlines.py /tmp/si_world.json assets/biology/anatomy3d/heart_centerlines_v1.json

方法函式（中心線估計 tube_cl／refine／best_ring、subdiv／mesh／graph／loops）複製自 build_lung_centerlines.py（不 import，那支是直接執行的腳本）。
接點畫法照 docs/ht3d_接力指南.md 第 5b 節：每段半徑陣列、切線相接（depart／arrive）、Murray（母³＝Σ子³）、半徑連續、封口只留在彎折與游離端、管口埋進接上的血管或心房壁。
結尾呼叫 polish_vessels.polish_path（整理接點）。

內容：
  * mesh 段（schematic=false）：lca（左冠狀動脈主幹）、lad／lcx 與它們的分支 lad_1…、lcx_1…、rca 與分支 rca_1…（資料集裡每條分支各是一段管子；
    建置時把子管接到母管壁上、半徑由根部往下依 Murray 遞減，樹梢不低於約 0.4 mm）、aorta（升主動脈）。網格估出的半徑留在 radius_mesh。
  * 伴行心靜脈（schematic=true）：每條動脈分支旁一條 v_<分支>（半徑 1.3×動脈、貼在動脈旁、逆流向由樹梢走回根部，匯進母管的伴行靜脈）；
    大心靜脈 gcv（沿 lad 旁、繞過左緣，接 lcx 的靜脈）、後室靜脈 plv、小心靜脈 scv（右冠狀動脈旁）、冠狀竇 cs（沿心臟後面的房室溝，半徑由 1.95 依 Murray 增到 2.33 mm，
    終點埋在右心房壁）；前心靜脈 v_rca_4／9／12 直接開口在右心房壁（mouthEnd）。
  * 微血管床（schematic=true）：每條動脈分支末端一組 sa_<分支>（小動脈）→ cp_<分支>_0..2（3 條微血管，半徑 0.222 mm，已放大；巢狀 U 形環伸入心肌 0.6–2 mm）→ sv_<分支>（小靜脈）接回伴行靜脈。
    FOCUS_BED（lad_2，第 3 步特寫）的環放大（深度 ×2.2、長度 ×1.4），其餘床用實際比例。
  * 心腔與追蹤用路徑：lv_out（左心室→主動脈）、root_L／root_R（主動脈竇內到兩個冠狀動脈開口）、ra_in（冠狀竇口→右心房內）；tr_lad／tr_gcv 是追蹤用的路徑片段（kind 'chamber'，不畫）。
  * 檢查：最小曲率半徑／管半徑、血管互相穿插（不在接點處）、右心房壁交會。
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


# ======================================================================================
# 心臟／冠狀循環場景
from scipy.interpolate import CubicSpline
CV='cardiovascular.'
HC=np.array([0.030,1.290,0.080])   # 心臟中心（只用來估「外向」方向，決定伴行靜脈、微血管在血管的哪一側）
def unit(v):
  v=np.asarray(v,float);return v/np.linalg.norm(v)
def ss(x):
  x=np.clip(x,0,1);return x*x*(3-2*x)
def cum(p):
  p=np.asarray(p,float);return np.r_[0,np.cumsum(np.linalg.norm(np.diff(p,axis=0),axis=1))]
def spline(pts,step=0.0012):
  pts=np.asarray(pts,float);d=cum(pts);keep=np.r_[True,np.diff(d)>1e-7];pts=pts[keep];d=d[keep]
  cs=CubicSpline(d,pts,bc_type='natural');n=max(4,int(d[-1]/step)+1);s=np.linspace(0,d[-1],n);return cs(s)
def smooth_path(P,passes=4,ramp=0.004):
  P=np.asarray(P,float).copy();c=cum(P);w=(ss(c/ramp)*ss((c[-1]-c)/ramp))[:,None]
  for _ in range(passes):
    Q=P.copy();Q[1:-1]=P[1:-1]+0.5*w[1:-1]*(0.5*(P[:-2]+P[2:])-P[1:-1]);P=Q
  return P
def depart(P,T,ell):
  P=np.asarray(P,float);c=cum(P);T=unit(T);w=ss(c/ell)[:,None]
  Q=(1-w)*(P[0]+T[None,:]*c[:,None])+w*P;Q[0]=P[0];return spline(Q,float(np.mean(np.diff(c))))
def arrive(P,T,ell):
  return depart(np.asarray(P,float)[::-1],-np.asarray(T,float),ell)[::-1]
def path_at(P,c,sv):
  i=int(np.clip(np.searchsorted(c,sv)-1,0,len(P)-2));f=np.clip((sv-c[i])/max(c[i+1]-c[i],1e-9),0,1);return P[i]*(1-f)+P[i+1]*f
def tan_at(P,c,sv,h=0.002):
  return unit(path_at(P,c,min(sv+h,c[-1]))-path_at(P,c,max(sv-h,0)))
def nearest(P,pt):
  d=np.linalg.norm(P-pt,axis=1);i=int(np.argmin(d));return i,float(d[i])
def bez(p0,p1,p2,p3,n=20):
  t=np.linspace(0,1,n)[:,None];return (1-t)**3*np.asarray(p0)+3*(1-t)**2*t*np.asarray(p1)+3*(1-t)*t**2*np.asarray(p2)+t**3*np.asarray(p3)
def gtaper(P,a,b):
  c=cum(P);t=ss(c/c[-1])*0.6+0.4*(c/c[-1]);return a*(b/a)**t
def resamp(P,step=0.0012):
  c=cum(P);n=max(2,int(round(c[-1]/step))+1);s=np.linspace(0,c[-1],n);return np.stack([np.interp(s,c,P[:,k]) for k in range(3)],1)
def raw(i):return np.array(D[i]['P']).reshape(-1,3),np.array(D[i]['I']).reshape(-1,3)
def inside_parity(P,T,pt):
  v0=P[T[:,0]];e1=P[T[:,1]]-v0;e2=P[T[:,2]]-v0;votes=0
  for d in ([1,0.3,0.2],[0.2,1,0.3],[0.3,0.2,-1]):
    d=unit(d);h=np.cross(d,e2);a=(e1*h).sum(1);ok=np.abs(a)>1e-14;f=np.where(ok,1/np.where(ok,a,1),0)
    s=pt-v0;u=f*(s*h).sum(1);q=np.cross(s,e1);v=f*(q*d).sum(1);t=f*(e2*q).sum(1)
    votes+=int((ok&(u>=0)&(v>=0)&(u+v<=1)&(t>1e-7)).sum()%2)
  return votes>=2
def min_curv_ratio(p,r):
  p=np.asarray(p);r=np.asarray(r);worst=(1e9,0)
  for i in range(2,len(p)-2):
    a,b,c=p[i-2],p[i],p[i+2];ab=np.linalg.norm(b-a);bc=np.linalg.norm(c-b);ca=np.linalg.norm(c-a)
    ar=np.linalg.norm(np.cross(b-a,c-a))
    if ar<1e-14: continue
    R=ab*bc*ca/(2*ar);q=R/max(r[i],1e-9)
    if q<worst[0]: worst=(q,i)
  return worst
segs={}
def put(sid,pts,rad,kind,o2,src,schem=False,**kw):
  pts=np.asarray(pts,float);rad=np.broadcast_to(np.asarray(rad,dtype=float),(len(pts),)).copy()
  segs[sid]=dict(kind=kind,o2=o2,source=src,schematic=schem,points=pts,radius=rad,**kw)

# ---------------- 1. 冠狀動脈：把資料集裡每一段管子的中心線抽出來 ----------------
def tubes_of(mname):
  mid=CV+mname;P0=np.array(D[mid]['P']).reshape(-1,3);T0=np.array(D[mid]['I']).reshape(-1,3)
  nc,lab=connected_components(graph(P0,T0));Lp=loops(P0,T0);out=[]
  for c in range(nc):
    vs=set(np.where(lab==c)[0]);ls=[l for l in Lp if l[0] in vs]
    if len(ls)!=2: continue
    a=P0[ls[0]].mean(0);b=P0[ls[1]].mean(0)
    ra=float(np.linalg.norm(P0[ls[0]]-a,axis=1).mean());rb=float(np.linalg.norm(P0[ls[1]]-b,axis=1).mean())
    if rb>ra: a,b,ra,rb=b,a,rb,ra          # 近端＝開口環較大的那一端
    rp,rr,q=tube_cl(mid,a,b)
    P=smooth_path(rp,passes=6,ramp=0.004);P[0]=a;P[-1]=b
    out.append(dict(P=spline(P,0.0012),r0=ra,r1=rb,rr=np.interp(np.linspace(0,1,len(rp)),np.linspace(0,1,len(rr)),rr),rp=rp))
  return out
T={}
for pref,mn in (('lad','anterior_interventricular_artery'),('lcx','circumflex_artery_of_heart'),('rca','right_coronary_artery'),('lca','left_coronary_artery')):
  for k,t in enumerate(tubes_of(mn)):
    T[pref if k==0 else f'{pref}_{k}']=t
print('tubes',len(T),sorted(T))
for k,t in T.items(): t['L']=float(cum(t['P'])[-1]);t['c']=cum(t['P']);t['kids']=[];t['parent']=None
# 親子關係：子管的近端貼在母管中心線上（資料集的樹，距離都 < 1.5 mm）；左主幹分成前室間支與迴旋支
T['lad']['parent']='lca';T['lcx']['parent']='lca'
for k,t in T.items():
  if k in ('lca','rca','lad','lcx'): continue
  best=None
  for k2,t2 in T.items():
    if k2==k or t2['r0']<=t['r0'] or k2=='lca': continue
    i,d=nearest(t2['P'],t['P'][0])
    if best is None or d<best[0]: best=(d,k2,i)
  assert best and best[0]<0.0025,(k,best)
  t['parent']=best[1]
for k,t in T.items():
  if t['parent']: T[t['parent']]['kids'].append(k)
for k,t in T.items():
  if not t['parent']: continue
  par=T[t['parent']]
  if k in ('lad','lcx'): t['sb']=par['L']
  else:
    i,d=nearest(par['P'],t['P'][0]);t['sb']=float(par['c'][i])
for k,t in T.items(): print('  %-7s parent=%-7s sb=%s  L=%.1f mm r0=%.2f r1=%.2f mm'%(k,t['parent'],('%.1f'%(t['sb']*1000)) if 'sb' in t else '-',t['L']*1000,t['r0']*1000,t['r1']*1000))

# ---------------- 2. 半徑：由粗到細（Murray：母管³＝繼續走的部分³＋分出去的子管³） ----------------
R_ROOT={'lca':(1.95e-3,1.85e-3),'rca':(2.0e-3,0.5e-3)}
R_FORCE={'lad':1.50e-3,'lcx':1.40e-3}     # 左主幹分叉：1.5³＋1.4³≈1.85³
def order():
  out=[];q=['lca','rca']
  while q:
    k=q.pop(0);out.append(k);q+=sorted(T[k]['kids'],key=lambda x:T[x].get('sb',0))
  return out
ORDER=order()
for k in ORDER:
  t=T[k];c=t['c']
  if k in R_ROOT: rs,rt=R_ROOT[k]
  else:
    rs=R_FORCE.get(k,t.get('rs'));rt=max(min(t['r1'],0.8*rs),0.40e-3)
  t['rs']=rs
  for attempt in range(2):
    prof=gtaper(t['P'],rs,rt) if k!='lca' else np.linspace(rs,rt,len(c))
    for kid in sorted(t['kids'],key=lambda x:T[x]['sb']):
      sb=T[kid]['sb'] if kid not in R_FORCE else c[-1]
      rp=float(np.interp(sb,c,prof))
      if kid in R_FORCE: rc=R_FORCE[kid]
      else:
        rc=min(T[kid]['r0'],0.78*rp);rc=max(rc,min(0.5e-3,0.78*rp))
        kappa=((rp**3-rc**3)**(1/3))/rp;prof=prof*(1-(1-kappa)*ss((c-sb+0.004)/0.008))
      T[kid]['rs']=rc
    if k=='lca' or prof[-1]>=0.38e-3 or attempt==1: break
    rt=min(rt*0.40e-3/prof[-1],0.85*rs)     # 分出子管後末端會變細：把末端目標半徑放大，讓最後的小動脈不低於 0.4 mm（再細就要接微血管）
  t['rt']=rt;t['R']=prof
for k in ORDER[:3]+['rca']: print('  radius',k,np.round(T[k]['R'][[0,len(T[k]['R'])//2,-1]]*1000,2))

# ---------------- 3. 分支改成從母管壁、沿母管切線分出（切線相接的 Y，口徑連續） ----------------
def anchor_child(k):
  t=T[k];par=T[t['parent']];P=t['P']
  if k in ('lad','lcx'):
    O=par['P'][-1];Tp=tan_at(par['P'],par['c'],par['c'][-1]);Q=P[1:];d_ch=unit(P[min(8,len(P)-1)]-P[0]);O2=O
  else:
    sb=t['sb'];O=path_at(par['P'],par['c'],sb);Tp=tan_at(par['P'],par['c'],sb)
    rp=float(np.interp(sb,par['c'],par['R']));rc=t['rs']
    cd=cum(P);Q=P[np.searchsorted(cd,0.0015):];d_ch=unit(Q[min(4,len(Q)-1)]-Q[0])
    perp=d_ch-(d_ch@Tp)*Tp;perp=unit(perp) if np.linalg.norm(perp)>1e-6 else d_ch
    O2=O+perp*max(0.0,rp-rc)*0.85
  Td=Tp if Tp@d_ch>=0 else -Tp
  ang=float(np.degrees(np.arccos(np.clip(Td@d_ch,-1,1))))
  Pn=np.vstack([O2,Q]);Ln=cum(Pn)[-1]
  if ang<75: Pn=depart(spline(Pn,0.0012),Td,min(0.008,0.4*Ln))
  else: Pn=spline(Pn,0.0012)
  t['P0']=P;t['P']=Pn;t['c']=cum(Pn);t['L']=float(t['c'][-1]);t['ang']=ang
  # 半徑陣列跟著新長度重取樣
  t['R']=np.interp(np.linspace(0,1,len(Pn)),np.linspace(0,1,len(t['R'])),t['R'])
for k in ORDER:
  if T[k]['parent']: anchor_child(k)
print('branch angles (deg)',{k:round(T[k]['ang']) for k in ORDER if 'ang' in T[k]})

# ---------------- 4. 心靜脈：伴行靜脈（示意，資料集沒有）——每條動脈分支各有一條，沿動脈旁邊走，匯進母管的伴行靜脈 ----------------
VF=1.3     # 伴行靜脈口徑＝動脈 × 1.3（心靜脈通常比伴行的動脈粗；示意，見 sources.md）
RA_P,RA_T=raw(CV+'right_atrium')
RA_C=RA_P.mean(0)
def lateral(P):
  Tt=np.gradient(P,axis=0);Tt/=np.linalg.norm(Tt,axis=1)[:,None]+1e-12
  N=P-HC;N/=np.linalg.norm(N,axis=1)[:,None]
  Lv=np.cross(Tt,N);Lv/=np.linalg.norm(Lv,axis=1)[:,None]+1e-12
  for _ in range(8): Lv[1:-1]=(Lv[:-2]+2*Lv[1:-1]+Lv[2:])/4
  return Lv/(np.linalg.norm(Lv,axis=1)[:,None]+1e-12)
def offset_path(k,sign,gap=0.0008):
  t=T[k];d=t['R']+VF*t['R']+gap;return t['P']+sign*d[:,None]*lateral(t['P'])
ATREE={k:cKDTree(t['P']) for k,t in T.items()}
def clearance(Pv,Rv,excl,skip=6):
  worst=1e9
  for k2,t2 in T.items():
    if k2 in excl: continue
    d,j=ATREE[k2].query(Pv);g=d-t2['R'][j]-Rv;g[:skip]=1;g[-skip:]=1;worst=min(worst,float(g.min()))
  return worst
def family(k):
  t=T[k];s={k}
  if t['parent']: s.add(t['parent']);s|=set(T[t['parent']]['kids'])
  s|=set(t['kids']);return s
def choose_sign(k):
  best=None
  for sg in (1,-1):
    c=clearance(offset_path(k,sg),VF*T[k]['R'],family(k))
    if best is None or c>best[0]: best=(c,sg)
  return best[1]
def finish(pts,R,step=0.0012):
  """折線＋對齊的半徑 → 樣條重取樣（半徑依弧長比例對應）"""
  pts=np.asarray(pts,float);R=np.asarray(R,float);c=cum(pts);P=spline(pts,step)
  return P,np.interp(np.linspace(0,1,len(P)),c/c[-1],R)
def join_into(Pv,Rv,tgt,j_near,ell=0.008,back=0.004):
  """靜脈 Pv（流動順序；尾端在匯入處附近）沿目標靜脈 tgt 的切線匯入：管口埋進目標管內，口徑連續（Y 形匯流）"""
  tp=segs[tgt]['points'];tr=segs[tgt]['radius'];i,_=nearest(tp,j_near);J=tp[i];rp=float(tr[i])
  Tf=unit(tp[min(i+3,len(tp)-1)]-tp[max(i-3,0)]);rc=float(Rv[-1])
  cP=cum(Pv);k=int(np.searchsorted(cP,cP[-1]-back));k=max(0,min(k,len(Pv)-2))
  app=Pv[k]-J;perp=app-(app@Tf)*Tf;perp=unit(perp) if np.linalg.norm(perp)>1e-9 else Tf
  Jin=J+perp*max(0.0,rp-rc)*0.85
  Q=np.vstack([Pv[:k+1],Jin]);Rq=np.r_[Rv[:k+1],rc];Q,Rq=finish(Q,Rq)
  Q=arrive(Q,Tf,min(ell,0.45*cum(Q)[-1]));Rq=np.interp(np.linspace(0,1,len(Q)),np.linspace(0,1,len(Rq)),Rq)
  return Q,Rq,i
def to_atrium(Pv,Rv,reach=0.012):
  """靜脈尾端沿著朝右心房的方向延伸，直到管口埋進心房壁（前心靜脈直接注入右心房）"""
  E=Pv[-1];d=unit(RA_C-E);pts=[E];ok=False
  for s in np.arange(0.001,reach,0.001):
    p=E+d*s;pts.append(p)
    if inside_parity(RA_P,RA_T,p): ok=True;break
  if ok: pts.append(pts[-1]+d*0.0015)
  Q=np.vstack([Pv[:-1],np.array(pts)]);Rq=np.r_[Rv[:-1],np.full(len(pts),Rv[-1])];Q,Rq=finish(Q,Rq)
  n=len(Q);P2=Q.copy();w=np.clip((cum(Q)[-1]-cum(Q))/0.008,0,1)  # 只在最後 8 mm 內磨圓
  Q=smooth_path(Q,passes=10,ramp=0.003);return Q,Rq,ok
BV={}   # 伴行靜脈（動脈順序：近端→遠端）
SGN={}
# 主幹：大心靜脈 gcv（前室間支旁邊由心尖往上，到分叉轉進迴旋支的溝裡）→ 冠狀靜脈竇 cs
SGN['lad']=choose_sign('lad')
def near_sign(k,ref):
  P1=offset_path(k,1)[0];P2=offset_path(k,-1)[0];return 1 if np.linalg.norm(P1-ref)<=np.linalg.norm(P2-ref) else -1
SGN['lcx']=near_sign('lcx',offset_path('lad',SGN['lad'])[0])
for k in ('lad','lcx'): BV[k]=offset_path(k,SGN[k])
lcx=T['lcx'];QP=int(np.argmin(np.abs(lcx['P'][:,1]-1.294)+np.where(np.arange(len(lcx['P']))<12,9,0)))   # 迴旋支走到心臟左後方（y≈1.294）處，大心靜脈轉進冠狀靜脈竇
print('Q index on lcx',QP,'of',len(lcx['P']),np.round(lcx['P'][QP],4))
PA=BV['lad'][::-1];RA_=(VF*T['lad']['R'])[::-1];PB=BV['lcx'][:QP+1]
# 分叉處抄近路：大心靜脈不繞到分叉點，而是在分叉前 ~13 mm 離開前室間支旁邊，用一段圓弧接到分叉後 ~13 mm 的迴旋支旁邊
n1=11;n2=11;tA=unit(PA[-n1]-PA[-n1-4]);tB=unit(PB[n2+4]-PB[n2])
ch=np.linalg.norm(PB[n2]-PA[-n1]);hh=0.45*ch
pts=np.vstack([PA[:-n1],bez(PA[-n1],PA[-n1]+tA*hh,PB[n2]-tB*hh,PB[n2],16)[1:-1],PB[n2:]])
Rg=np.r_[RA_[:-n1],np.linspace(RA_[-n1],RA_[-1],14),np.full(len(PB)-n2,RA_[-1])]
pg,rg=finish(pts,Rg)
for _ in range(3): pg=smooth_path(pg,passes=10,ramp=0.006)
put('gcv',pg,rg,'vein','poor','generated schematic: great cardiac vein; runs beside the anterior interventricular artery (mesh centreline) from the apex to the base, then along the circumflex artery',True,capStart=True,capEnd=False)
# 冠狀靜脈竇：沿心臟後方的房室溝，由左向右進右心房（解剖資料集沒有，示意；路徑控制點由 LA／LV／RA 網格位置決定）
VQ=pg[-1];Tg=unit(pg[-1]-pg[-6])
def hits_all(o,d,maxd=0.03):
  d=unit(d);v0=RA_P[RA_T[:,0]];e1=RA_P[RA_T[:,1]]-v0;e2=RA_P[RA_T[:,2]]-v0
  h=np.cross(d,e2);a=(e1*h).sum(1);ok=np.abs(a)>1e-14;f=np.where(ok,1/np.where(ok,a,1),0)
  s_=o-v0;u=f*(s_*h).sum(1);q=np.cross(s_,e1);v=f*(q*d).sum(1);t=f*(e2*q).sum(1)
  m=ok&(u>=0)&(v>=0)&(u+v<=1)&(t>1e-7)&(t<maxd);return np.sort(t[m])
def to_wall(Pv,Rv,frac=0.75):
  """靜脈尾端接到右心房：右心房網格是有厚度的殼（外面、裡面各一層），管口停在殼的厚度中間偏內側（埋進心房壁，從外面看是一個開口接進心房）"""
  E=Pv[-1];Tn=unit(Pv[-1]-Pv[-4]);d=unit(0.6*Tn+0.4*unit(RA_C-E));t=hits_all(E,d)
  if len(t)>=2: L=t[0]+frac*(t[1]-t[0])
  elif len(t)==1: L=t[0]+0.002
  else: L=0.004
  end=E+d*L;Q=np.vstack([Pv[:-1],E,E+d*0.5*L,end]);Rq=np.r_[Rv[:-1],Rv[-1],Rv[-1],Rv[-1]];Q,Rq=finish(Q,Rq)
  return Q,Rq,len(t)
CSC=[VQ,np.array([0.046,1.286,0.0385]),np.array([0.034,1.278,0.0330]),np.array([0.022,1.271,0.0330]),np.array([0.012,1.2655,0.0395]),np.array([0.005,1.2625,0.0480])]
csP=spline(np.array(CSC),0.0012);csP=depart(csP,Tg,0.014);csP=smooth_path(csP,passes=10,ramp=0.006)
CS_R0=float(rg[-1])

# 其餘各條動脈的伴行靜脈：流動順序＝遠端（微血管床）→近端；近端接進母管的伴行靜脈（或前心靜脈直接進右心房）
SEGV={}      # 動脈 id → (靜脈 seg id, 取點的 index 範圍)；用來讓子管的靜脈知道要匯進哪一條
def vein_seg_of(par,ib):
  if par=='lad': return 'gcv'
  if par=='lcx': return 'gcv' if ib<=QP else 'plv'
  return 'v_'+par
def base_vein(k,ref_pt=None):
  if ref_pt is None: sg=choose_sign(k)
  else: sg=near_sign(k,ref_pt)
  SGN[k]=sg;BV[k]=offset_path(k,sg);return sg
def build_vein(k):
  """靜脈 v_k：沿動脈 k 旁邊，由遠端往近端走；近端匯進母管的靜脈"""
  t=T[k];par=T[t['parent']]
  ib,_=nearest(par['P'],t['P'][0]);J0=BV[t['parent']][ib]
  base_vein(k,J0)
  Pv=BV[k][::-1];Rv=(VF*t['R'])[::-1]
  tgt=vein_seg_of(t['parent'],ib)
  Q,R,_=join_into(Pv,Rv,tgt,J0)
  put('v_'+k,Q,R,'vein','poor',f'generated schematic: companion vein of the artery {k}; joins {tgt}',True,capStart=True,capEnd=False)
  # 它自己的子管要用到的 index→匯入目標
for k in ('lad','lcx'): pass   # 已在 gcv／plv
# 迴旋支遠端的靜脈 plv：流向左後方（Q 點），匯進冠狀靜脈竇起端
Pp=BV['lcx'][QP:][::-1];Rp=(VF*T['lcx']['R'][QP:])[::-1]
put('cs',csP,np.full(len(csP),CS_R0),'vein','poor','generated schematic: coronary sinus (not in the dataset); runs along the posterior atrioventricular groove from left to right into the right atrium',True,capStart=True,capEnd=False,mouthEnd=True)
# 小心靜脈 scv：右緣動脈 rca_1 旁邊，由心尖往上，接著沿右冠狀動脈走到心臟後方，進冠狀靜脈竇
sgR=choose_sign('rca');SGN['rca']=sgR;BV['rca']=offset_path('rca',sgR)
IB43,_=nearest(T['rca']['P'],T['rca_1']['P'][0])
base_vein('rca_1',BV['rca'][IB43])
PA1=BV['rca_1'][::-1];RA1=(VF*T['rca_1']['R'])[::-1];PB1=BV['rca'][IB43:]
n1=11;n2=11;tA=unit(PA1[-n1]-PA1[-n1-4]);tB=unit(PB1[n2+4]-PB1[n2]);ch=np.linalg.norm(PB1[n2]-PA1[-n1]);hh=0.45*ch
pts=np.vstack([PA1[:-n1],bez(PA1[-n1],PA1[-n1]+tA*hh,PB1[n2]-tB*hh,PB1[n2],16)[1:-1],PB1[n2:]])
Rs1=np.r_[RA1[:-n1],np.linspace(RA1[-n1],RA1[-1],14),np.full(len(PB1)-n2,RA1[-1])]
pS,rS=finish(pts,Rs1);pS=smooth_path(pS,passes=10,ramp=0.006)
# 冠狀靜脈竇的口徑：從大心靜脈末端的口徑開始，每匯進一條（後室靜脈 plv、小心靜脈 scv）就依 Murray（半徑³相加）變粗
ccs=cum(csP);JPLV=csP[int(np.searchsorted(ccs,0.016))];j1,_=nearest(csP,JPLV);j2,_=nearest(csP,pS[-1])
r3=CS_R0**3+float(Rp[-1])**3*ss((ccs-ccs[j1]+0.003)/0.006)+float(rS[-1])**3*ss((ccs-ccs[j2]+0.003)/0.006)
segs['cs']['radius']=r3**(1/3)
print('coronary sinus radius mm: start %.2f end %.2f'%(segs['cs']['radius'][0]*1000,segs['cs']['radius'][-1]*1000))
Qp_,Rp_,ip=join_into(Pp,Rp,'cs',JPLV,ell=0.012,back=0.006)
put('plv',Qp_,Rp_,'vein','poor','generated schematic: posterior vein of the left ventricle (companion of the distal circumflex artery); joins the coronary sinus',True,capStart=True,capEnd=False)
pS2,rS2,ips=join_into(pS,rS,'cs',pS[-1],ell=0.012,back=0.012)
put('scv',pS2,rS2,'vein','poor','generated schematic: small cardiac vein; runs with the right marginal artery and the right coronary artery, joins the coronary sinus',True,capStart=True,capEnd=False)
# 前心靜脈（右心室前壁）：rca_4／rca_9／rca_12 的伴行靜脈，直接進右心房
for k in ('rca_4','rca_9','rca_12'):
  base_vein(k);Pv=BV[k][::-1];Rv=(VF*T[k]['R'])[::-1]
  Q,R,nh=to_wall(Pv,Rv);put('v_'+k,Q,R,'vein','poor',f'generated schematic: anterior cardiac vein (companion of {k}); empties directly into the right atrium',True,capStart=True,capEnd=False,mouthEnd=True)
  print('   atrium mouth',k,'wall hits',nh)
# 其餘：由近到遠（BFS），子管的靜脈匯進母管的靜脈
def vein_seg_of(par,ib):
  if par=='lad': return 'gcv'
  if par=='lcx': return 'gcv' if ib<=QP else 'plv'
  if par=='rca_1': return 'scv'
  return 'v_'+par
for k in ORDER:
  if k in ('lca','rca','lad','lcx','rca_1','rca_4','rca_9','rca_12'): continue
  build_vein(k)
print('veins:',sorted(s for s in segs if s.startswith(('v_','gcv','plv','scv','cs'))))

# ---------------- 5. 心肌微血管床：每條動脈分支的末端接一小片微血管，再回到伴行靜脈（示意，口徑放大） ----------------
CAPR=0.222e-3;ARTR=CAPR*3**(1/3)
FOCUS_BED='lad_2';FOCUS_SCALE=(2.2,1.4)   # 特寫那一床：環的深度 ×2.2、沿動脈方向的長度 ×1.4
VEIN_OF={'lad':'gcv','lcx':'plv','rca_1':'scv'}
beds={}
for k in ORDER:
  if k=='lca': continue
  t=T[k];E=t['P'][-1];u=unit(E-t['P'][-6]);nrm=unit(E-HC)
  vid=VEIN_OF.get(k,'v_'+k)
  if k=='rca':
    # 右冠狀動脈末端（十字交叉附近）沒有自己的伴行靜脈：微血管直接匯進小心靜脈
    sp=segs['scv']['points'];i0,_=nearest(sp,E);V0=sp[i0];rv0=float(segs['scv']['radius'][i0]);own=False
  else:
    V0=segs[vid]['points'][0];rv0=float(segs[vid]['radius'][0]);own=True
  dv=V0-E;w=unit(dv-(dv@u)*u)
  Na=E+u*0.0035-nrm*0.0010
  art=bez(E,E+u*0.0013,Na-u*0.0013,Na,10)
  put('sa_'+k,art,np.linspace(t['R'][-1],ARTR,len(art)),'arteriole','rich',f'generated schematic: arteriole continuing the end of {k}',True)
  if own:
    Nv=V0+u*0.0035-nrm*0.0010;ven=bez(Nv,Nv-u*0.0013,V0+u*0.0013,V0,10)
    put('sv_'+k,ven,np.linspace(ARTR,rv0,len(ven)),'venule','poor',f'generated schematic: venule draining the capillaries of {k} into its companion vein',True)
  else:

    Nv=E+w*(np.linalg.norm(dv))*0.9+u*0.0035-nrm*0.0010   # 靜脈在 w 方向上
    ven=bez(Nv,Nv-u*0.0013,V0+u*0.0013,V0,10)
    Q,R,_=join_into(ven,np.linspace(ARTR,0.85*rv0,len(ven)),'scv',V0,ell=0.005,back=0.003)
    put('sv_'+k,Q,R,'venule','poor',f'generated schematic: venule draining the capillaries of {k} into the small cardiac vein',True,capEnd=False)
  Nv_=segs['sv_'+k]['points'][0]
  caps=[]
  # 放大示意的那一床（FOCUS_BED，場景第 3 步的特寫）環更深、更長，畫面上才看得出「U 形環」；其餘床用實際比例
  SD,SA=(FOCUS_SCALE) if k==FOCUS_BED else (1.0,1.0)
  for j,(dep,a) in enumerate(((0.0008,0.0032),(0.0017,0.0046),(0.0026,0.0060))):
    dep*=SD;a*=SA
    P1=Na+u*0.9*a-nrm*dep*1.3;P2=Nv_+u*0.9*a-nrm*dep*1.3
    cp=bez(Na,P1,P2,Nv_,22);put(f'cp_{k}_{j}',cp,CAPR,'capillary','rich>poor','generated schematic (enlarged): myocardial capillary between the terminal arteriole and venule',True);caps.append(f'cp_{k}_{j}')
  beds[k]=dict(sa='sa_'+k,sv='sv_'+k,caps=caps,Na=Na,Nv=Nv_,E=E,u=u,nrm=nrm)
print('beds',len(beds))

# ---------------- 6. 主動脈根部、心腔內的路徑、冠狀動脈段 ----------------
ao=tubes_of('ascending_aorta')[0];AP=ao['P'] if ao['P'][0,1]<ao['P'][-1,1] else ao['P'][::-1]
AR=np.interp(np.linspace(0,1,len(AP)),np.linspace(0,1,len(ao['rr'])),ao['rr'] if ao['P'][0,1]<ao['P'][-1,1] else ao['rr'][::-1])
AR=np.convolve(np.pad(AR,6,mode='edge'),np.ones(13)/13,mode='valid')
put('aorta',AP,AR,'artery','rich','mesh: ascending_aorta (centreline and radius estimated from the mesh)',False,radius_mesh=ao['rr'])
valve=np.mean([raw(CV+n)[0].mean(0) for n in ('left_coronary_leaflet','right_coronary_leaflet','non_coronary_leaflet')],axis=0)
lv_in=np.array([0.046,1.282,0.080]);a0=AP[0];ta=unit(AP[3]-AP[0])
lvp=np.vstack([bez(lv_in,lv_in+np.array([-0.016,0.012,-0.004]),a0-ta*0.018,a0,24),AP[:1]])
put('lv_out',lvp,0.012,'chamber','rich','generated: left ventricle interior -> aortic valve -> aortic root',True)
for nm,ost in (('root_L',T['lca']['P'][0]),('root_R',T['rca']['P'][0])):
  i,_=nearest(AP,ost);ax=AP[i];d=ost-ax;mid=ax+d*0.55+np.array([0,0.0015,0])
  put(nm,spline([ax,mid,ost],0.0012),0.003,'chamber','rich','generated: aortic sinus centre -> coronary ostium',True)
OSTIA=dict(L=T['lca']['P'][0].tolist(),R=T['rca']['P'][0].tolist())
for k,t in T.items():
  kw={}
  if k in ('lca','rca'): kw['capStart']=False    # 開口埋進主動脈竇壁
  elif k not in ('lad','lcx'): kw['capStart']=False   # 側支從母管壁分出，管口埋在母管裡
  put(k,t['P'],t['R'],'artery','rich','mesh: centreline of the dataset coronary artery tube (anchored to the parent vessel wall); radius from the mesh opening loops, tapered with Murray law',False,**kw)
  if k=='lca': segs[k]['mouthStart']=True
# 右心房內（血球終點）
cend=segs['cs']['points'][-1];ra_cav=np.array([-0.010,1.283,0.068])
put('ra_in',bez(cend,cend+unit(ra_cav-cend)*0.006,ra_cav-unit(ra_cav-cend)*0.006,ra_cav,16),0.004,'chamber','poor','generated: coronary sinus mouth -> right atrium interior',True)

# ---------------- 7. 追蹤用的路徑（沿真實血管中心線切出來的片段，不畫；血球流動用原本的血管段） ----------------
def slice_seg(src,i0,i1,sid,o2):
  p=segs[src]['points'];put(sid,p[i0:i1+1],segs[src]['radius'][i0:i1+1],'chamber',o2,f'route slice of {src}',True)
TR_BED='lad_2'
ib,_=nearest(T['lad']['P'],T[TR_BED]['P'][0]);slice_seg('lad',0,ib,'tr_lad','rich')
tgt=None
# v_lad_2 匯入大心靜脈 gcv 的位置
vp=segs['v_'+TR_BED]['points'];ig,_=nearest(segs['gcv']['points'],vp[-1]);slice_seg('gcv',ig,len(segs['gcv']['points'])-1,'tr_gcv','poor')
TRACER=dict(left_route=['lv_out','root_L','lca','tr_lad',TR_BED],bed=TR_BED,caps=beds[TR_BED]['caps'],cap_pick=beds[TR_BED]['caps'][1],
            venous_route=['sv_'+TR_BED,'v_'+TR_BED,'tr_gcv','cs','ra_in'])

# ---------------- 8. 檢查 ----------------
for k in ('lca','rca'): segs[k]['mouthStart']=True
report={}
for sid,sg in segs.items():
  if sg['kind']=='chamber': continue
  q,i=min_curv_ratio(sg['points'],sg['radius']);report[sid]=dict(min_curv_over_r=round(q,2),n=len(sg['points']))
mc=sorted((v['min_curv_over_r'],k) for k,v in report.items());print('min curvature/r (lowest 12)',mc[:12])
drawn=[k for k,s in segs.items() if s['kind']!='chamber' and k!='aorta']
TRS={k:cKDTree(segs[k]['points']) for k in drawn}
overl=[]
for i,a in enumerate(drawn):
  pa=segs[a]['points'];ra=segs[a]['radius']
  for b in drawn[i+1:]:
    pb=segs[b]['points'];rb=segs[b]['radius'];d,j=TRS[b].query(pa);gap=d-ra-rb[j]
    if gap.min()>=-0.0001: continue
    near=max(0.015,4*float(max(ra.max(),rb.max())));m=gap<-0.0001
    for e in [e for e in (pa[0],pa[-1],pb[0],pb[-1]) if TRS[b].query(e)[0]<(ra.max()+rb.max())*1.3 and TRS[a].query(e)[0]<(ra.max()+rb.max())*1.3]:
      m&=np.linalg.norm(pa-e,axis=1)>near
    if m.any(): overl.append((round(float(gap[m].min())*1000,2),a,b,int(m.sum())))
print('OVERLAP (not at junctions):',len(overl),sorted(overl)[:25])
report['_overlap_not_at_junctions']=[list(x) for x in overl]

# ---------------- 9. 輸出 ----------------
def seg_out(v):
  o=dict(kind=v['kind'],o2=v['o2'],source=v['source'],schematic=v['schematic'],points=np.round(v['points'],5).tolist(),radius=np.round(v['radius'],6).tolist())
  if 'radius_mesh' in v: o['radius_mesh']=np.round(np.asarray(v['radius_mesh']),5).tolist()
  for kk in ('capStart','capEnd'):
    if v.get(kk) is False: o[kk]=False
  for kk in ('mouthStart','mouthEnd'):
    if v.get(kk): o[kk]=True
  return o
named=dict(tracer=TRACER,ostia=OSTIA,aortic_valve=np.round(valve,5).tolist(),cs_mouth=np.round(cend,5).tolist(),ra_cavity=np.round(ra_cav,5).tolist(),
  tube_order=ORDER,beds={k:dict(E=np.round(b['E'],5).tolist(),Na=np.round(b['Na'],5).tolist(),Nv=np.round(b['Nv'],5).tolist(),caps=b['caps']) for k,b in beds.items()},
  qidx_lcx=int(QP),lcx_q=np.round(T['lcx']['P'][QP],5).tolist())
out=dict(version='heart_centerlines_v1',units='m',axes='+X body left, +Y up, +Z anterior (same as si_scene_v1.glb)',generator='tools/anatomy/build_heart_centerlines.py',
 note='mesh: centrelines of the left/right coronary arteries and their branches (each branch is a separate tube in the dataset, anchored here to the parent wall) and the ascending aorta come from the glb meshes; the companion cardiac veins (great, small, anterior, posterior), the coronary sinus, the arterioles/capillaries/venules of the myocardium and the chamber links are generated schematics, not anatomical data; calibres of small vessels are enlarged.',
 validation=dict(method='min curvature radius / tube radius; drawn tubes that are not joined must not intersect (centreline distance >= r1+r2)',results=report),
 named=named,segments={k:seg_out(v) for k,v in segs.items()})
json.dump(out,open(sys.argv[2],'w'),separators=(',',':'))
print('wrote',sys.argv[2],len(segs),'segments')

# 血管接點整理（老師 2026-11-23：不要錐形殘端、半徑要連續漸變；規則見 tools/anatomy/polish_vessels.py 檔頭）
import os as _os, sys as _sys
_sys.path.insert(0, _os.path.dirname(_os.path.abspath(__file__)))
import polish_vessels as _pv
_pv.polish_path(sys.argv[2])
