#!/usr/bin/env python3
"""build_si_centerlines.py -- 從 si_scene_v1.glb 的網格估出血管中心線，並產生小腸場景的示意小分支。

用法（在 repo 根目錄）：
  node tools/anatomy/dump_glb_world.mjs assets/biology/anatomy3d/si_scene_v1.glb /tmp/si_world.json --modules /tmp/gl/node_modules
  python3 tools/anatomy/build_si_centerlines.py /tmp/si_world.json assets/biology/anatomy3d/si_centerlines_v1.json

方法：
  * mesh 段：在兩個開口邊界環之間算 geodesic 等值環（level set），取環的質心；
    再以「垂直切面 → 包住中心點的最小截面環」的面積質心反覆校正 3 次（refine）。
    細血管先做中點細分，避免長三角形讓等值環跳過彎道。
  * generated 段（schematic=true）：主動脈→腸繫膜上動脈末端到小腸壁的小動脈、腸壁上的微血管、
    回到腸繫膜上靜脈的小靜脈、肝臟內的路徑、下腔靜脈到右心房的接口。全部是示意，不是解剖資料。
  * 驗證：mesh 段每一點往外偏 0.5 r，向 8 個垂直方向射線，必須都在 4 r 內打到該血管網格（validation.results）。
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
# --- mesh-derived centerlines
asc=tube_cl(CV+'ascending_aorta',[0.0195,1.3168,0.073],[0.0058,1.3606,0.0823])
arch=tube_cl(CV+'aortic_arch',[0.0058,1.3606,0.0823],[0.0193,1.3608,0.0204])
tho=tube_cl(CV+'thoracic_aorta',[0.0193,1.3608,0.0204],[0.0089,1.2082,0.0436])
abd=tube_cl(CV+'abdominal_aorta',[0.0089,1.2082,0.0436],[0.0054,1.0309,0.0852])
sma=tube_cl(CV+'superior_mesenteric_artery',[0.0072,1.1272,0.0727],[-0.0561,1.0082,0.0782])
smaj=tube_cl(CV+'superior_mesenteric_artery',[-0.0057,1.0957,0.0984],[0.068,1.084,0.0998])
smv=tube_cl(CV+'superior_mesenteric_vein',[-0.0118,1.0502,0.1014],[-0.0039,1.1482,0.0843])
por=tube_cl(CV+'hepatic_portal_vein_2',[-0.0039,1.1482,0.0843],[-0.0074,1.1991,0.0843])
spl=tube_cl(CV+'splenic_vein',[0.0999,1.1559,0.0563],[-0.0039,1.1482,0.0843])
hv1=tube_cl(CV+'hepatic_veins',[-0.0178,1.2357,0.0901],[-0.0149,1.2446,0.0688])
hv2=tube_cl(CV+'hepatic_veins',[0.0001,1.2393,0.0777],[-0.0149,1.2446,0.0688])
ivca=tube_cl(CV+'inferior_vena_cava_abdominal_part',[-0.0086,1.0316,0.0788],[-0.0095,1.1725,0.0682])
ivct=tube_cl(CV+'inferior_vena_cava_thoracic_part',[-0.0095,1.1725,0.0682],[-0.0146,1.2631,0.0756])
cel=tube_cl(CV+'coeliac_trunk',[0.009,1.1391,0.0687],[0.0064,1.1563,0.0857])
cha=tube_cl(CV+'common_hepatic_artery',[0.0064,1.1563,0.0857],[-0.0214,1.1475,0.1136])
pha=tube_cl(CV+'proper_hepatic_artery',[-0.0214,1.1475,0.1136],[-0.0737,1.1588,0.1127])
jej=tube_cl('visceral.jejunum',[0.0249,1.086,0.0937],[-0.0346,1.0343,0.1201],step=0.003)
ile=tube_cl('visceral.ileum',[-0.0346,1.0343,0.1201],[-0.0733,0.9681,0.0799],step=0.003)
# LV -> aorta
lv_in=np.array([0.045,1.27,0.08]);lv_or=np.array([0.0121,1.3162,0.0779])
lvp=cat(bez(lv_in,lv_in+np.array([-0.004,0.012,0]),lv_or+np.array([0.008,-0.010,0]),lv_or,14),line(lv_or,asc[0][0]))
put('lv_out',lvp,np.linspace(0.012,0.012,len(lvp)),'chamber','rich','generated: left_ventricle interior -> aortic orifice loop',True)
# aorta: split abdominal at SMA origin / coeliac origin heights
ab_p,ab_r,_=abd
k_sma=int(np.argmin(np.abs(ab_p[:,1]-1.1272)));k_cel=int(np.argmin(np.abs(ab_p[:,1]-1.1391)))
ao=cat(asc[0],arch[0],tho[0],ab_p[:k_sma+1]);ao_r=np.r_[asc[1],arch[1][1:],tho[1][1:],ab_r[1:k_sma+1]][:len(ao)]
ao_r=np.interp(np.linspace(0,1,len(ao)),np.linspace(0,1,len(ao_r)),ao_r)
put('aorta',ao,ao_r,'artery','rich','mesh: ascending_aorta+aortic_arch+thoracic_aorta+abdominal_aorta (to SMA origin)')
put('aorta_lower',ab_p[k_sma:],ab_r[k_sma:],'artery','rich','mesh: abdominal_aorta (below SMA origin)')
# SMA from aorta center
s_p=cat(line(ab_p[k_sma],sma[0][0],0.0015),sma[0]);s_r=np.r_[np.full(len(s_p)-len(sma[0]),sma[1][0]),sma[1]]
put('sma',s_p,s_r,'artery','rich','mesh: superior_mesenteric_artery main trunk')
kt=int(np.argmin(np.linalg.norm(sma[0]-smaj[0][0],axis=1)))
j_p=cat(line(sma[0][kt],smaj[0][0],0.001),smaj[0]);j_r=np.r_[np.full(len(j_p)-len(smaj[0]),smaj[1][0]),smaj[1]]
put('sma_branch',j_p,j_r,'artery','rich','mesh: superior_mesenteric_artery branch (comp 4)')
# hepatic artery (coeliac -> common hepatic -> proper hepatic)
h_p=cat(line(ab_p[k_cel],cel[0][0],0.0015),cel[0],cha[0],pha[0]);h_r=np.r_[np.full(len(h_p)-len(cel[0])-len(cha[0])-len(pha[0])+2,cel[1][0]),cel[1],cha[1][1:],pha[1][1:]][:len(h_p)]
put('hep_artery',h_p,h_r,'artery','rich','mesh: coeliac_trunk+common_hepatic_artery+proper_hepatic_artery')
# veins
# the open loop at y=1.050 belongs to a side channel that circles down and rejoins the trunk;
# the flowing trunk starts at its lowest (most distal) point and runs up to the portal junction.
k_smv=int(np.argmin(smv[0][:len(smv[0])//2,1]))
smv=(smv[0][k_smv:],smv[1][k_smv:],smv[2][k_smv:])
put('smv',smv[0],smv[1],'vein','poor','mesh: superior_mesenteric_vein (trunk from its lowest point to the portal junction)')
put('splenic',spl[0],np.maximum(spl[1],0.0012),'vein','poor','mesh: splenic_vein')
put('portal',por[0],por[1],'vein','poor','mesh: hepatic_portal_vein_2')
ivc_all=cat(ivca[0],ivct[0])
def to_ivc(hv):
  k=int(np.argmin(np.linalg.norm(ivc_all-hv[0][-1],axis=1)));return cat(hv[0],line(hv[0][-1],ivc_all[k],0.0015)),k
h1,k1=to_ivc(hv1);h2,k2=to_ivc(hv2)
put('hv1',h1,0.0033,'vein','poor','mesh: hepatic_veins (comp A) + join to IVC axis')
put('hv2',h2,0.0033,'vein','poor','mesh: hepatic_veins (comp B) + join to IVC axis')
put('ivc_lower',ivc_all[:min(k1,k2)+1],np.r_[ivca[1],ivct[1][1:]][:min(k1,k2)+1],'vein','poor','mesh: inferior_vena_cava abdominal+thoracic (below hepatic veins)')
iu=ivc_all[min(k1,k2):];ra_or=np.array([-0.0127,1.2832,0.0839]);ra_in=np.array([-0.018,1.300,0.078])
up=cat(iu,bez(iu[-1],iu[-1]+(iu[-1]-iu[-4])/np.linalg.norm(iu[-1]-iu[-4])*0.008,ra_or-np.array([0,0.006,0]),ra_or,10),line(ra_or,ra_in))
put('ivc_upper',up,np.r_[np.r_[ivca[1],ivct[1][1:]][min(k1,k2):],np.full(len(up),0.011)][:len(up)],'vein','poor','mesh: inferior_vena_cava_thoracic_part (above hepatic veins) + generated entry into right_atrium')
# liver interior schematic
pe=por[0][-1];pt=(por[0][-1]-por[0][-4]);pt/=np.linalg.norm(pt)
def hv_dir(hv):d=hv[0][1]-hv[0][0];return d/np.linalg.norm(d)
liver_paths=[]
for nm,hv,off in [('liver_cap_a',hv1,np.array([-0.012,0,0.004])),('liver_cap_b',hv1,np.array([0.004,0,0.010])),('liver_cap_c',hv2,np.array([0.010,0,-0.004])),('liver_cap_d',hv2,np.array([-0.004,0,-0.008]))]:
  s=hv[0][0];mid=(pe+s)/2+off
  p=cat(bez(pe,pe+pt*0.010,mid-(s-pe)*0.15,mid,12),bez(mid,mid+(s-pe)*0.15,s-hv_dir(hv)*0.010,s,12))
  put(nm,p,0.0008,'capillary','poor','generated: schematic route through liver (portal end -> hepatic vein start)',True)
s=hv1[0][0];a=pha[0][-1];mid=(a+s)/2+np.array([0.004,0,0.006])
put('liver_cap_art',cat(bez(a,a+(a-pha[0][-4])/np.linalg.norm(a-pha[0][-4])*0.01,mid,mid,12),bez(mid,mid,s-hv_dir(hv1)*0.010,s,12)),0.0008,'capillary','rich','generated: schematic hepatic-artery blood through liver',True)
# --- small intestine schematic arterioles / wall capillaries / venules
GP,GT=union(['visceral.jejunum','visceral.ileum'])
OB=union(['visceral.ascending_colon','visceral.transverse_colon','visceral.descending_colon','visceral.pancreas','visceral.duodenum','visceral.stomach','visceral.liver','visceral.sigmoid_colon',CV+'superior_mesenteric_vein'])
gut=np.vstack([jej[0],ile[0][1:]]);gut_r=np.r_[jej[1],ile[1][1:]]
gtan=np.gradient(gut,axis=0);gtan/=np.linalg.norm(gtan,axis=1)[:,None]
src=np.vstack([sma[0][int(len(sma[0])*0.3):],smaj[0][3:]])
smv_low=smv[0][smv[0][:,1]<1.10]
arc=np.r_[0,np.cumsum(np.linalg.norm(np.diff(gut,axis=0),axis=1))]
cands=[]
for j in range(4,len(gut)-4,6):
  c=gut[j];ks=np.argsort(np.linalg.norm(src-c,axis=1))[:1];S=src[ks[0]]
  d=c-S;L=np.linalg.norm(d);d/=L
  h=first_hit(GP,GT,S,d,L)
  if h is None or h>0.07 or h<0.008: continue
  ob=first_hit(OB[0],OB[1],S,d,h)
  if ob is not None: continue
  W=S+d*h
  jj=int(np.argmin(np.linalg.norm(gut-W,axis=1)))
  cands.append((arc[jj],j,jj,S,W,h))
print('candidates',len(cands))
# pick 10 spread by arc length, prefer front (larger z of W)
cands.sort(key=lambda x:x[0]);chosen=[]
targets=np.linspace(arc[0]+0.05,arc[-1]-0.05,10)
for t in targets:
  best=min([c for c in cands if all(abs(c[0]-o[0])>0.06 for o in chosen)] or cands,key=lambda c:abs(c[0]-t)-0.5*c[4][2])
  if best not in chosen: chosen.append(best)
print('chosen',len(chosen),[round(c[0],2) for c in chosen])
focus=None
for k,(a0,j,jj,S,W,h) in enumerate(chosen):
  C=gut[jj];T0=gtan[jj];n0=W-C;n0-=T0*(n0@T0);n0/=np.linalg.norm(n0)
  # wall capillary: walk along centerline, rotate normal around tangent, raycast to surface
  sign=1 if jj+8<len(gut) else -1;pts=[]
  for m in range(0,9):
    i=jj+sign*m;Ti=gtan[i];ang=np.radians(70)*m/8
    nn=n0-Ti*(n0@Ti);nn/=np.linalg.norm(nn);b=np.cross(Ti,nn);dirn=np.cos(ang)*nn+np.sin(ang)*b
    hh=first_hit(GP,GT,gut[i],dirn,0.05)
    if hh is None: break
    pts.append(gut[i]+dirn*(hh+0.0007))
  if len(pts)<5: continue
  pts=np.array(pts);pts=smooth(pts,1)
  cap,_=resample(pts,0.0015)
  Wc=cap[0];nW=(Wc-C)/np.linalg.norm(Wc-C)
  bulge=np.cross(d:= (Wc-S)/np.linalg.norm(Wc-S),T0)*0.004
  art=bez(S,S+(Wc-S)*0.35+bulge,Wc+nW*0.010,Wc,26)
  E=cap[-1];Ce=gut[int(np.argmin(np.linalg.norm(gut-E,axis=1)))];nE=(E-Ce)/np.linalg.norm(E-Ce)
  V=smv_low[int(np.argmin(np.linalg.norm(smv_low-E,axis=1)))]
  ven=bez(E,E+nE*0.010,V+(E-V)*0.35-bulge,V,26)
  put(f'art_{k}',art,0.0007,'arteriole','rich','generated: schematic arteriole from superior_mesenteric_artery to small-intestine wall',True)
  put(f'cap_{k}',cap,0.00045,'capillary','rich>poor','generated: schematic capillary bed on the small-intestine wall (ray-cast onto jejunum/ileum surface)',True)
  put(f'ven_{k}',ven,0.0008,'venule','poor','generated: schematic venule from small-intestine wall to superior_mesenteric_vein',True)
  print('branch',k,'S',S.round(3),'W',Wc.round(3),'z',round(Wc[2],3))
# --- validation: lumen of mesh-derived segments against union of nearby meshes
VAL={'lv_out':[CV+'left_ventricle',CV+'ascending_aorta',CV+'left_coronary_leaflet',CV+'right_coronary_leaflet',CV+'non_coronary_leaflet'],
 'aorta':[CV+'ascending_aorta',CV+'aortic_arch',CV+'thoracic_aorta',CV+'abdominal_aorta'],'aorta_lower':[CV+'abdominal_aorta'],
 'sma':[CV+'superior_mesenteric_artery',CV+'abdominal_aorta'],'sma_branch':[CV+'superior_mesenteric_artery'],
 'hep_artery':[CV+'coeliac_trunk',CV+'common_hepatic_artery',CV+'proper_hepatic_artery',CV+'abdominal_aorta'],
 'smv':[CV+'superior_mesenteric_vein'],'splenic':[CV+'splenic_vein'],'portal':[CV+'hepatic_portal_vein_2'],
 'hv1':[CV+'hepatic_veins',CV+'inferior_vena_cava_thoracic_part'],'hv2':[CV+'hepatic_veins',CV+'inferior_vena_cava_thoracic_part'],
 'ivc_lower':[CV+'inferior_vena_cava_abdominal_part',CV+'inferior_vena_cava_thoracic_part'],'ivc_upper':[CV+'inferior_vena_cava_thoracic_part',CV+'right_atrium'],
 'liver_cap_a':['visceral.liver'],'liver_cap_b':['visceral.liver'],'liver_cap_c':['visceral.liver'],'liver_cap_d':['visceral.liver'],'liver_cap_art':['visceral.liver']}
report={}
for sid,ids in VAL.items():
  P,T=union(ids);sg=segs[sid];p=sg['points'];r=sg['radius']
  if sid.startswith('liver'):
    ok=np.array([inside(P,T,np.asarray(q,float),np.array([0.,1.,0.]),0.03,8) for q in p]);
  else:
    ok=lumen_report(P,T,p,r,0.5)
  report[sid]=dict(n=int(len(ok)),inside=int(ok.sum()),bad_index=[int(x) for x in np.where(~ok)[0]])
  print('VALID',sid,ok.mean().round(3),np.where(~ok)[0][:20])
out=dict(version='si_centerlines_v1',units='m',axes='+X body left, +Y up, +Z anterior (same as si_scene_v1.glb)',
 generator='tools/anatomy/build_si_centerlines.py',note='mesh: centerline estimated from the glb mesh (level-set rings between open boundary loops, refined by plane slices); generated: schematic, not anatomical data.',
 validation=dict(method='8 rays perpendicular to the path from a point offset 0.5 r from the centerline must all hit the vessel mesh (union of listed nodes) within 4 r; liver routes: point inside liver mesh',results=report),
 segments={k:dict(kind=v['kind'],o2=v['o2'],source=v['source'],schematic=v['schematic'],points=np.round(v['points'],5).tolist(),radius=np.round(v['radius'],5).tolist()) for k,v in segs.items()},
 gut=dict(points=np.round(gut,4).tolist(),radius=np.round(gut_r,4).tolist()))
json.dump(out,open(sys.argv[2],'w'),separators=(',',':'))
print('wrote',sys.argv[2],len(segs))

# 血管接點整理（老師 2026-11-23：不要錐形殘端、半徑要連續漸變；規則見 tools/anatomy/polish_vessels.py 檔頭）
import os as _os, sys as _sys
_sys.path.insert(0, _os.path.dirname(_os.path.abspath(__file__)))
import polish_vessels as _pv
_pv.polish_path(sys.argv[2])
