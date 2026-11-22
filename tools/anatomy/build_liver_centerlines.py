#!/usr/bin/env python3
"""build_liver_centerlines.py -- 肝臟獨立場景（ht3d_scene_liver_1122_v1.js）用的中心線 liver_centerlines_v1.json。

用法（在 repo 根目錄）：
  node tools/anatomy/dump_glb_world.mjs assets/biology/anatomy3d/si_scene_v1.glb /tmp/si_world.json --modules /tmp/gl/node_modules
  python3 tools/anatomy/build_liver_centerlines.py /tmp/si_world.json assets/biology/anatomy3d/si_centerlines_v1.json assets/biology/anatomy3d/liver_centerlines_v1.json [--plot /tmp/lv]

這份檔案做什麼：
  * 沿用小腸場景已有的真實網格中心線：腹主動脈（到腹腔動脈幹起點）、腹腔動脈幹→肝總動脈（網格）、腸繫膜上靜脈、脾靜脈、肝門靜脈、下腔靜脈。
  * 「固有肝動脈」：資料集的網格往右外側延伸到肝的外緣，和教科書「固有肝動脈上行到肝門、再分左右支」不符，
    所以只取網格到肝總動脈末端，後面的固有肝動脈改成示意路徑（標 schematic）。
  * 肝內的血管樹（全部 schematic，不是解剖資料）：
      肝門靜脈樹 pv*   （由肝門分右／左支，再逐級分叉）
      肝動脈樹   ha*   （伴著門靜脈分支，口徑較細）
      肝靜脈樹   hv*   （右肝靜脈 RHV、中肝靜脈 MHV、左肝靜脈 LHV；MHV 與 LHV 先合成一條短幹再入下腔靜脈；流向＝往下腔靜脈）
      肝竇連接   sn*   （門靜脈／肝動脈終末分支 → 肝靜脈分支的細管，示意肝竇網）
      肝小葉模型 lb*   （放大示意：3 組門脈管區＋中央靜脈＋放射狀肝竇）
    樹的形狀用「空間殖民」演算法（Runions 2007）在肝臟網格內長出來：門靜脈樹與肝靜脈樹共用同一批吸引點，彼此競爭，所以自然交錯、互不穿插，
    這和真實肝臟「門靜脈分支與肝靜脈分支交錯排列」的格局一致。
  * 口徑：主幹取自文獻（見 sources.md「肝臟場景」）；分支用 r = r_終端 × (終端數)^(1/2.7) 逐級推算，這只是示意用的分支律，不是量測值。
  * 每一段在末端加半球蓋（讓分叉處看起來是圓滑的 Y 形），血流方向＝點的排列順序。
需要：numpy、scipy。固定亂數種子，可重複執行。
"""
import json, sys, math
import numpy as np
from scipy.spatial import cKDTree

args = [a for a in sys.argv[1:] if not a.startswith('--')]
WORLD, SI, OUT = args[:3]
PLOT = sys.argv[sys.argv.index('--plot') + 1] if '--plot' in sys.argv else None
rng = np.random.default_rng(20261122)
E_EXP = 2.7            # 分支口徑法則的指數（示意）
D_STEP, D_INFL, D_KILL = 0.0075, 0.07, 0.0092   # 空間殖民：步長、影響半徑、吸引點殺除距離（公尺）
N_ATTR = 2600

def unit(v): v = np.asarray(v, float); n = np.linalg.norm(v); return v / n if n > 1e-12 else v
def smoothstep(x): x = np.clip(x, 0, 1); return x * x * (3 - 2 * x)
def bez(p0, p1, p2, p3, n=14):
    t = np.linspace(0, 1, n)[:, None]
    return (1 - t) ** 3 * p0 + 3 * (1 - t) ** 2 * t * p1 + 3 * (1 - t) * t ** 2 * p2 + t ** 3 * p3
def arclen(P): return np.r_[0, np.cumsum(np.linalg.norm(np.diff(P, axis=0), axis=1))]
def resample(P, step, keep_n=None):
    P = np.asarray(P, float); s = arclen(P); L = s[-1]
    n = keep_n or max(2, int(round(L / step)) + 1); t = np.linspace(0, L, n)
    return np.stack([np.interp(t, s, P[:, k]) for k in range(3)], 1)
def smooth_poly(P, it=3):
    P = np.array(P, float)
    for _ in range(it):
        if len(P) > 2: P[1:-1] = 0.25 * P[:-2] + 0.5 * P[1:-1] + 0.25 * P[2:]
    return P
def add_cap(P, R, frac=0.6, n=4, at='end'):
    """半球蓋：沿端點切線再延伸 frac×r，半徑依圓弧縮到 0。at='end' 加在最後一點之後；at='start' 加在第一點之前。"""
    P = np.asarray(P, float); R = np.asarray(R, float)
    if at == 'start': P2, R2 = add_cap(P[::-1], R[::-1], frac, n, 'end'); return P2[::-1], R2[::-1]
    t = unit(P[-1] - P[-3 if len(P) > 2 else 0]); r = R[-1]; ext = frac * r
    th = np.linspace(0, math.pi / 2, n + 1)[1:]
    return np.vstack([P, P[-1] + t * (ext * np.sin(th))[:, None]]), np.r_[R, r * np.cos(th)]

# ---------------------------------------------------------------- 肝臟網格：內外判斷、離表面距離
W = json.load(open(WORLD)); CLS = json.load(open(SI)); S0 = CLS['segments']
LP = np.array(W['visceral.liver']['P']).reshape(-1, 3); LT = np.array(W['visceral.liver']['I']).reshape(-1, 3)
_v0 = LP[LT[:, 0]]; _e1 = LP[LT[:, 1]] - _v0; _e2 = LP[LT[:, 2]] - _v0
_d = unit([0.5774, 0.5771, 0.5777]); _h = np.cross(_d, _e2); _a = (_e1 * _h).sum(1); _ok = np.abs(_a) > 1e-12
_f = np.where(_ok, 1 / np.where(_ok, _a, 1), 0.0)
def inside(pts):
    pts = np.atleast_2d(pts); res = np.zeros(len(pts), bool)
    for s in range(0, len(pts), 200):
        q = pts[s:s + 200]; sv = q[:, None, :] - _v0[None]
        u = _f[None] * (sv * _h[None]).sum(2); qv = np.cross(sv, _e1[None]); v = _f[None] * (qv * _d).sum(2); t = _f[None] * (qv * _e2[None]).sum(2)
        res[s:s + 200] = ((_ok[None] & (u >= 0) & (u <= 1) & (v >= 0) & (u + v <= 1) & (t > 1e-9)).sum(1) % 2) == 1
    return res
_area = np.linalg.norm(np.cross(_e1, _e2), axis=1) / 2; _ti = rng.choice(len(LT), 90000, p=_area / _area.sum())
_r1, _r2 = rng.random((90000, 1)), rng.random((90000, 1)); _fl = (_r1 + _r2) > 1; _r1 = np.where(_fl, 1 - _r1, _r1); _r2 = np.where(_fl, 1 - _r2, _r2)
SURF = cKDTree(_v0[_ti] + _e1[_ti] * _r1 + _e2[_ti] * _r2)
def sd(pts): return SURF.query(np.atleast_2d(pts))[0]

# ---------------------------------------------------------------- 錨點
portal0 = S0['portal']; H = np.array(portal0['points'][-1]); Ht = unit(np.array(portal0['points'][-1]) - np.array(portal0['points'][-4]))
ivc0 = np.array(S0['ivc_lower']['points'][-1])           # 肝靜脈匯入下腔靜脈的位置（IVC 軸上）
H_ART = H + np.array([-0.0020, 0.0, 0.0105])             # 固有肝動脈到達肝門的位置（在門靜脈前方）
print('hilum', np.round(H, 4), 'inside', inside(H)[0], 'sd', np.round(sd(H)[0], 4), '| ivc', np.round(ivc0, 4), 'inside', inside(ivc0)[0])

# ---------------------------------------------------------------- 吸引點（肝內均勻取點，離表面 ≥ 8 mm）
lo, hi = LP.min(0), LP.max(0); cand = rng.uniform(lo, hi, (36000, 3)); cand = cand[sd(cand) > 0.008]
cand = cand[inside(cand)]; A = cand[rng.choice(len(cand), min(N_ATTR, len(cand)), replace=False)]
print('attractors', len(A), 'of', len(cand), '| liver mean', np.round(A.mean(0), 3))
def cl(mask): return A[mask].mean(0) if mask.any() else A.mean(0)
def near_attr(pt): return A[int(np.argmin(np.linalg.norm(A - np.asarray(pt), axis=1)))]
tRA = cl((A[:, 0] < -0.03) & (A[:, 2] > 0.085) & (A[:, 1] > 1.17))     # 右前區（約第 5、8 段）
tRP = cl((A[:, 0] < -0.03) & (A[:, 2] <= 0.085))                       # 右後區（約第 6、7 段）
tLL = cl(A[:, 0] > 0.03)                                               # 左外側區（約第 2、3 段）
tLM = cl((A[:, 0] > -0.015) & (A[:, 0] <= 0.03) & (A[:, 2] > 0.09))    # 左內側區／方形葉（約第 4 段）

# ---------------------------------------------------------------- 種子：門靜脈左右支（先畫出骨架，空間殖民再長出小分支）、三條肝靜脈
P_, par_, tr_, dr_ = [], [], [], []
def node(p, par, tr, d): P_.append(np.asarray(p, float)); par_.append(par); tr_.append(tr); dr_.append(unit(d)); return len(P_) - 1
def stem(root, tr, target, n, free=0):
    k, d = root, unit(np.asarray(target) - P_[root])
    for i in range(n):
        q = P_[k] + d * D_STEP
        if i >= free and not (inside(q)[0] and sd(q)[0] > 0.005): break
        k = node(q, k, tr, d); d = unit(0.8 * d + 0.2 * unit(np.asarray(target) - q))
    return k
root_p = node(H, -1, 0, Ht)
kR = stem(root_p, 0, tRP * 0.5 + tRA * 0.5, 3); stem(kR, 0, tRA, 6); stem(kR, 0, tRP, 6)                  # 右支 → 右前／右後
kL = stem(root_p, 0, np.array([0.025, 1.20, 0.09]), 4); stem(kL, 0, tLL, 5); stem(kL, 0, tLM, 4)           # 左支（先橫行）→ 外側／內側
# 肝靜脈：根在下腔靜脈壁外 ~11 mm（IVC 半徑約 9.5 mm）
def hv_root(dirv, tr): return node(ivc0 + unit(dirv) * 0.0105, -1, tr, dirv)
rr = hv_root([-1.0, -0.15, -0.05], 1); stem(rr, 1, near_attr([-0.07, 1.16, 0.07]), 8, free=2)                        # RHV：往右、往下外側
rc = hv_root([0.15, 0.0, 1.0], 2); j = stem(rc, 2, ivc0 + np.array([0.0, -0.005, 0.045]), 2, free=2)               # MHV／LHV 共幹：往前
stem(j, 2, near_attr([-0.02, 1.13, 0.12]), 8, free=1)                                                             # MHV：往前下（Cantlie 線）
stem(j, 2, near_attr([0.04, 1.20, 0.11]), 7, free=1)                                                              # LHV：往左前
n_seed = len(P_)

# ---------------------------------------------------------------- 空間殖民（兩種樹共用吸引點）
alive = np.ones(len(A), bool)
for it in range(400):
    Pa = np.array(P_); kd = cKDTree(Pa); idx = np.where(alive)[0]
    if not len(idx): break
    d, nn = kd.query(A[idx]); kill = d < D_KILL; alive[idx[kill]] = False
    m = (~kill) & (d < D_INFL)
    if not m.any(): break
    acc = {}
    for a_i, n_i in zip(idx[m], nn[m]): acc[n_i] = acc.get(n_i, 0) + unit(A[a_i] - Pa[n_i])
    new = []
    for n_i, v in acc.items():
        dn = unit(unit(v) + 0.32 * dr_[n_i]); new.append((n_i, Pa[n_i] + dn * D_STEP, dn))
    if not new: break
    q = np.array([x[1] for x in new]); good = inside(q) & (sd(q) > 0.005)
    for (n_i, p, dn), g in zip(new, good):
        if g: node(p, n_i, tr_[n_i], dn)
    if not good.any(): break
print('nodes', len(P_), 'iterations', it, 'attractors left', int(alive.sum()))

# ---------------------------------------------------------------- 整理成分支段
NP = len(P_)
def children():
    ch = [[] for _ in range(NP)]
    for i, p in enumerate(par_):
        if p >= 0: ch[p].append(i)
    return ch
alive_node = np.ones(NP, bool)
for _ in range(3):                                    # 修掉太短的終端小刺（<3 個節點）
    ch = [[c for c in cc if alive_node[c]] for cc in children()]
    for i in range(n_seed, NP):
        if alive_node[i] and not ch[i]:               # 葉
            chain = [i]; k = par_[i]
            while k >= n_seed and len(ch[k]) == 1: chain.append(k); k = par_[k]
            if len(chain) <= 2 and len(ch[k]) >= 2:
                for c in chain: alive_node[c] = False
ch = [[c for c in cc if alive_node[c]] for cc in children()]
segs = []     # dict(tree, nodes, parent, depth)
def walk(start, parent_seg, depth, tree):
    for c in ch[start]:
        chain = [start, c]; k = c
        while len(ch[k]) == 1: k = ch[k][0]; chain.append(k)
        sid = len(segs); segs.append(dict(tree=tree, nodes=chain, parent=parent_seg, depth=depth, kids=[]))
        if parent_seg is not None: segs[parent_seg]['kids'].append(sid)
        walk(k, sid, depth + 1, tree)
roots = [i for i in range(NP) if par_[i] < 0]
for r in roots:
    if tr_[r] == 0: walk(r, None, 0, 0)
# 肝靜脈：樹 1 = RHV；樹 2 = 共幹＋MHV＋LHV（共幹是從 rc 出發的那一段）
for r in roots:
    if tr_[r] in (1, 2): walk(r, None, 0, tr_[r])
def nterm(s): return 1 if not segs[s]['kids'] else sum(nterm(k) for k in segs[s]['kids'])
for i, s in enumerate(segs): s['n'] = nterm(i)
top = {t: [i for i, s in enumerate(segs) if s['tree'] == t and s['parent'] is None] for t in (0, 1, 2)}
nP = sum(segs[i]['n'] for i in top[0]); nR = sum(segs[i]['n'] for i in top[1]); nM = sum(segs[i]['n'] for i in top[2])
print('segments', len(segs), '| terminals portal', nP, 'RHV', nR, 'MHV+LHV', nM)

# ---------------------------------------------------------------- 口徑（公尺）。主幹取文獻，分支用 r = r_leaf · n^(1/e)
R_PORTAL_HILUM = 4.6e-3    # 門靜脈進肝門處（直徑約 9.2 mm；文獻正常 7–13 mm，平均約 9.6–10.3 mm）
R_RHV = 4.4e-3             # 右肝靜脈（直徑 8.8 mm；一項超音波研究平均 8.6 mm）
R_HA_HILUM = 1.6e-3        # 固有肝動脈（直徑約 3.2 mm，示意）
leaf = {0: R_PORTAL_HILUM / nP ** (1 / E_EXP), 1: R_RHV / max(nR, 1) ** (1 / E_EXP)}; leaf[2] = leaf[1]
leaf_a = R_HA_HILUM / nP ** (1 / E_EXP)
print('r_leaf portal %.2f mm, hv %.2f mm, artery %.2f mm' % (leaf[0] * 1e3, leaf[1] * 1e3, leaf_a * 1e3))

OUTSEG = {}
def put(sid, P, R, kind, o2, source, schematic=True, **extra):
    OUTSEG[sid] = dict(kind=kind, o2=o2, source=source, schematic=schematic, points=np.round(np.asarray(P), 5).tolist(), radius=np.round(np.asarray(R), 6).tolist(), **extra)
def seg_poly(s):
    P = np.array([P_[i] for i in s['nodes']]); P = smooth_poly(P, 3) if len(P) > 3 else P
    return resample(P, 0.004, keep_n=max(3, int(round(arclen(P)[-1] / 0.004)) + 1))

# ---- 真實網格中心線（沿用）：主動脈（到腹腔動脈幹起點）、腸繫膜上靜脈、脾靜脈、門靜脈、下腔靜脈
ap = np.array(S0['aorta']['points']); ar = np.array(S0['aorta']['radius']); c0 = np.array(S0['hep_artery']['points'][0])
kc = int(np.argmin(np.linalg.norm(ap - c0, axis=1)))
put('aorta', ap[:kc + 1], ar[:kc + 1], 'artery', 'rich', 'mesh: aorta (to coeliac trunk origin)', False)
for k in ('smv', 'splenic'): OUTSEG[k] = S0[k]
pp = np.array(portal0['points']); pr = np.linspace(5.0e-3, R_PORTAL_HILUM, len(pp))
P2, R2 = add_cap(pp, pr); put('portal', P2, R2, 'vein', 'poor', 'mesh: hepatic_portal_vein_2 (centerline) | caliber: literature, see sources.md', False, tube=True)
for k in ('ivc_lower', 'ivc_upper'): OUTSEG[k] = S0[k]

# ---- 腹腔動脈幹→肝總動脈（網格）→固有肝動脈（示意）→肝門
hp = np.array(S0['hep_artery']['points']); hr = np.array(S0['hep_artery']['radius']); kcut = 36
pha = bez(hp[kcut], hp[kcut] + np.array([0.0, 0.020, -0.004]), H_ART - np.array([0.0, 0.022, 0.0]), H_ART, 14)
ha_trunk_P = np.vstack([hp[:kcut + 1], pha[1:]]); ha_trunk_R = np.r_[hr[:kcut + 1], np.linspace(hr[kcut], R_HA_HILUM, len(pha) - 1)]
ha_trunk_P = resample(ha_trunk_P, 0.003); ha_trunk_R = np.interp(np.linspace(0, 1, len(ha_trunk_P)), np.linspace(0, 1, len(ha_trunk_R)), ha_trunk_R)
Pc, Rc = add_cap(ha_trunk_P, ha_trunk_R)
put('trunk_ha', Pc, Rc, 'artery', 'rich', 'mesh: coeliac_trunk+common_hepatic_artery (to its end) + generated proper hepatic artery to the hilum', True, tube=True)

# ---- 肝內三種樹
nm = {0: 'pt', 1: 'ht', 2: 'ht'}; seg_id = {}; counters = {}
def new_id(prefix, depth):
    d = min(depth, 6); counters[(prefix, d)] = counters.get((prefix, d), 0) + 1; return '%s%d_%d' % (prefix, d, counters[(prefix, d)])   # 第 6 層以後共用 6（流速、密度同一組），編號仍不重複
polys = {}
for i, s in enumerate(segs):
    pref = nm[s['tree']]
    seg_id[i] = new_id(pref, s['depth']); polys[i] = seg_poly(s)
radii = {i: np.linspace(1.05, 0.95, len(polys[i])) * leaf[s['tree']] * s['n'] ** (1 / E_EXP) for i, s in enumerate(segs)}
for i, s in enumerate(segs):
    P, R = polys[i], radii[i]
    if s['tree'] == 0:
        P2, R2 = add_cap(P, R); put(seg_id[i], P2, R2, 'vein', 'poor', 'generated: schematic portal-vein branch (space colonisation inside liver mesh)', True, tube=True, level=s['depth'], terminals=s['n'])
# 動脈：伴著門靜脈分支（口徑較細，位置沿用門靜脈段偏一個固定方向，起點接上一段動脈的終點）
art_end = {}
for i in sorted([i for i, s in enumerate(segs) if s['tree'] == 0], key=lambda k: segs[k]['depth']):
    s = segs[i]; P, Rp = polys[i], radii[i]; n = len(P); Ra = np.linspace(1.05, 0.95, n) * leaf_a * s['n'] ** (1 / E_EXP)
    t = unit(P[-1] - P[0]); ref = np.array([0, 0, 1.0]) if abs(t[2]) < 0.9 else np.array([1.0, 0, 0]); n1 = unit(np.cross(t, ref)); n2 = np.cross(t, n1)
    ang = (i * 2.399963) % (2 * math.pi); off = (math.cos(ang) * n1 + math.sin(ang) * n2) * (Rp.mean() + 1.15 * Ra.mean() + 0.0004)
    start = art_end[s['parent']] if s['parent'] is not None else H_ART
    u = np.linspace(0, 1, n)[:, None]; blend = smoothstep(u / 0.4); o = (1 - blend) * (start - P[0]) + blend * off
    Pa = P + o; Pa[0] = start
    P2, R2 = add_cap(Pa, Ra); put('at' + seg_id[i][2:], P2, R2, 'artery', 'rich', 'generated: schematic hepatic-artery branch accompanying the portal branch', True, tube=True, level=s['depth'], terminals=s['n'])
    art_end[i] = Pa[-1]
ivc_pts = np.array(S0['ivc_lower']['points']); ivc_rad = np.array(S0['ivc_lower']['radius'])
# 肝靜脈：流向＝往下腔靜脈，所以把 root→leaf 的點序反轉；半球蓋在「分叉那一端」（反轉後是起點）
for i, s in enumerate(segs):
    if s['tree'] == 0: continue
    P, R = polys[i], radii[i]; P2, R2 = add_cap(P, R); P2, R2 = P2[::-1], R2[::-1]
    if s['depth'] == 0:                                   # 主幹：往下腔靜脈軸再延伸，讓管子一定進到下腔靜脈壁裡（之後依 tubeRange 在管壁處截斷）
        kk = int(np.argmin(np.linalg.norm(ivc_pts - P2[-1], axis=1))); P2 = np.vstack([P2, ivc_pts[kk]]); R2 = np.r_[R2, R2[-1]]
    put(seg_id[i], P2, R2, 'vein', 'poor', 'generated: schematic hepatic-vein branch (flow toward the IVC)', True, tube=True, level=s['depth'], terminals=s['n'], tree=s['tree'])
# 三條主幹接下腔靜脈：算出管子畫到哪裡（管子進入下腔靜脈壁就停，和小腸場景一樣）
for sid, d in list(OUTSEG.items()):
    if not sid.startswith('ht') or d.get('level') != 0: continue
    P = np.array(d['points']); dist = []
    for p in P:
        k = int(np.argmin(np.linalg.norm(ivc_pts - p, axis=1))); dist.append(np.linalg.norm(ivc_pts[k] - p) / ivc_rad[k])
    dist = np.array(dist); sl = arclen(P); cut = np.where(dist < 0.95)[0]
    if len(cut) and cut[0] > 0:                           # 依弧長內插到「離下腔靜脈軸 0.95 倍半徑」處截斷，管子剛好停在下腔靜脈壁
        i = cut[0]; f = (dist[i - 1] - 0.95) / max(1e-9, dist[i - 1] - dist[i]); d['tubeRange'] = [0, round(float((sl[i - 1] + f * (sl[i] - sl[i - 1])) / sl[-1]), 4)]
leaf_nodes = [i for i, s in enumerate(segs) if s['tree'] == 0 and not s['kids']]
hv_ids = [i for i, s in enumerate(segs) if s['tree'] != 0]
hv_pts = [(i, polys[i]) for i in hv_ids]

# ---------------------------------------------------------------- 肝小葉模型（放大示意）：選一個門靜脈終端＋最近的肝靜脈分支當 P*, Q*
def pick_lobule():
    best = None
    for i in leaf_nodes:
        tip = polys[i][-1]
        if not (-0.075 < tip[0] < -0.01 and tip[1] > 1.12): continue
        for j, Pj in hv_pts:
            if segs[j]['n'] > 6: continue                           # 接在較細的肝靜脈分支上
            k = int(np.argmin(np.linalg.norm(Pj - tip, axis=1))); d = np.linalg.norm(Pj[k] - tip)
            if 0.024 <= d <= 0.034:
                score = tip[2] + 0.5 * (-abs(tip[0] + 0.03))      # 偏前（鏡頭從前方看）、偏肝中央
                if best is None or score > best[0]: best = (score, i, j, k, tip, Pj[k])
    return best
bp = pick_lobule()
if bp is None: raise SystemExit('找不到適合放肝小葉的位置，調整條件')
_, ip, jq, kq, PS, QS = bp
print('lobule pair: portal terminal', seg_id[ip], np.round(PS, 4), '-> hv', seg_id[jq], np.round(QS, 4), 'dist %.1f mm' % (np.linalg.norm(QS - PS) * 1e3))
ax = unit(QS - PS); tmp = np.array([0, 1.0, 0]) if abs(ax[1]) < 0.9 else np.array([1.0, 0, 0]); e1 = unit(np.cross(ax, tmp)); e2 = np.cross(ax, e1)
Cc = (PS + QS) / 2; RHO, HH = 0.0062, 0.0072
AS = art_end[ip]                                        # 該終端旁的動脈終點
lobule = dict(center=Cc.round(5).tolist(), axis=ax.round(5).tolist(), e1=e1.round(5).tolist(), e2=e2.round(5).tolist(), rho=RHO, half_height=HH, portal_tip=PS.round(5).tolist(), vein_tip=QS.round(5).tolist(), portal_seg=seg_id[ip], hv_seg=seg_id[jq])
ang0 = math.pi / 2
tract = []
for k in range(3):
    th = ang0 + k * 2 * math.pi / 3; rad = (math.cos(th) * e1 + math.sin(th) * e2) * RHO
    tang = (-math.sin(th) * e1 + math.cos(th) * e2)
    zs = np.linspace(-HH, HH, 9); wob = 0.0006 * np.sin(zs / HH * 3.0 + k)[:, None] * tang
    venule = Cc + rad + zs[:, None] * ax + wob; art = Cc + rad * 1.0 + zs[:, None] * ax + tang * 0.0021 + wob
    tract.append((venule, art, th))
    Pv, Rv = add_cap(venule, np.linspace(0.00085, 0.00060, 9), 0.5, 3, 'end'); Pv, Rv = add_cap(Pv, Rv, 0.5, 3, 'start')
    put('lb_venule%d' % k, Pv, Rv, 'vein', [0.0, 0.0], 'generated: schematic portal venule of a magnified lobule', True, tube=True)
    Pa_, Ra_ = add_cap(art, np.linspace(0.00040, 0.00030, 9), 0.5, 3, 'end'); Pa_, Ra_ = add_cap(Pa_, Ra_, 0.5, 3, 'start')
    put('lb_arteriole%d' % k, Pa_, Ra_, 'artery', 'rich', 'generated: schematic hepatic arteriole of a magnified lobule', True, tube=True)
    fb = bez(PS, PS + ax * 0.004 + rad * 0.2, venule[0] - ax * 0.004, venule[0], 10)
    put('lb_feed_v%d' % k, fb, np.linspace(0.00085, 0.00085, len(fb)), 'vein', 'poor', 'generated: feeder from the terminal portal branch to the lobule', True, tube=True)
    fa = bez(AS, AS + ax * 0.003 + rad * 0.2, art[0] - ax * 0.004, art[0], 10)
    put('lb_feed_a%d' % k, fa, np.linspace(0.00040, 0.00040, len(fa)), 'artery', 'rich', 'generated: feeder from the terminal hepatic-artery branch to the lobule', True, tube=True)
cv = np.vstack([Cc - ax * (HH + 0.0015), Cc, Cc + ax * HH, bez(Cc + ax * HH, Cc + ax * (HH + 0.004), QS - ax * 0.004, QS, 8)[1:]])
cvP, cvR = add_cap(resample(cv, 0.0015), np.full(len(resample(cv, 0.0015)), 0.00100), 0.5, 3, 'start')
put('lb_central', cvP, cvR, 'vein', 'poor', 'generated: schematic central vein of a magnified lobule', True, tube=True)
SIN_R = 0.00030; nsin = 0
for k, (venule, art, th) in enumerate(tract):
    for m in range(17):
        from_art = m % 4 == 3                              # 約四分之一的肝竇由肝動脈小分支起頭
        src = art if from_art else venule; t0 = rng.uniform(0.06, 0.94); i0 = t0 * (len(src) - 1)
        a_ = src[int(i0)] + (src[min(len(src) - 1, int(i0) + 1)] - src[int(i0)]) * (i0 - int(i0))
        t1 = float(np.clip(t0 + rng.normal(0, 0.12), 0.04, 0.96)); b_ = Cc + ax * ((t1 * 2 - 1) * HH * 0.95)
        mid = (a_ + b_) / 2; side = unit(np.cross(ax, b_ - a_)) * rng.normal(0, 0.0012)
        c1 = a_ + (b_ - a_) * 0.30 + side + ax * rng.normal(0, 0.0007); c2 = a_ + (b_ - a_) * 0.70 - side * 0.6 + ax * rng.normal(0, 0.0007)
        P = bez(a_, c1, c2, b_, 9)
        nsin += 1; put('lb_sin_%d' % nsin, P, np.full(9, SIN_R), 'sinusoid', [1.0, 0.45] if from_art else [0.0, 0.45], 'generated: schematic sinusoid of a magnified lobule (real diameter ~10 micrometres)', True, tube=True)

# ---------------------------------------------------------------- 肝竇連接（巨觀示意）：每個門靜脈終端與動脈終端接到附近的肝靜脈分支
SN_R = 0.00042; nsn = 0
for i in leaf_nodes:
    if i == ip: continue
    tips = [(polys[i][-1], 0.0, 2), (art_end[i], 1.0, 1)]
    for tip, o2s, count in tips:
        ds = []
        for j, Pj in hv_pts:
            k = int(np.argmin(np.linalg.norm(Pj - tip, axis=1))); ds.append((np.linalg.norm(Pj[k] - tip), j, k))
        ds.sort(); used = set()
        for dist, j, k in ds:
            if len(used) >= count or dist > 0.045 or dist < 0.007 or j in used: continue
            if j == jq and np.linalg.norm(tip - PS) < 0.02: continue
            used.add(j); Pj = hv_pts[[x for x, _ in hv_pts].index(j)][1]; end = Pj[k]
            side = unit(np.cross(unit(end - tip), [0.3, 0.8, 0.5])) * dist * rng.uniform(-0.25, 0.25)
            P = bez(tip, tip + (end - tip) * 0.30 + side, tip + (end - tip) * 0.70 - side, end, 10)
            nsn += 1; put('sn_%d' % nsn, P, np.full(10, SN_R), 'sinusoid', [o2s, 0.45], 'generated: schematic sinusoid link (terminal branch to hepatic-vein branch)', True, tube=True)
print('sinusoid links', nsn, '| lobule sinusoids', nsin)

# ---------------------------------------------------------------- 輸出
def chain_of(k):
    out = []
    while k is not None: out.append(seg_id[k]); k = segs[k]['parent']
    return out
named = dict(right_portal=seg_id[top[0][0]], left_portal=seg_id[top[0][1]], rhv=seg_id[top[1][0]], mhv_lhv_trunk=seg_id[top[2][0]],
             portal_chain=chain_of(ip)[::-1],            # 肝門 → 肝小葉所在的門靜脈終端（追蹤血球用，流向順序）
             hv_chain=chain_of(jq))                      # 肝小葉所在的肝靜脈分支 → 往下腔靜脈的主幹（流向順序）
print('named', named)
tot_len = sum(float(arclen(np.array(d['points']))[-1]) for d in OUTSEG.values())
cal = dict(portal_hilum_radius_mm=R_PORTAL_HILUM * 1e3, rhv_radius_mm=R_RHV * 1e3, proper_hepatic_artery_radius_mm=R_HA_HILUM * 1e3, branch_exponent=E_EXP,
           leaf_radius_mm=dict(portal=round(leaf[0] * 1e3, 3), hepatic_vein=round(leaf[1] * 1e3, 3), artery=round(leaf_a * 1e3, 3)), terminals=dict(portal=int(nP), rhv=int(nR), mhv_lhv=int(nM)))
doc = dict(version=1, units='m', axes='+Y up, +Z anterior, +X body-left', generator='tools/anatomy/build_liver_centerlines.py',
           note='mesh: coeliac trunk / common hepatic artery / aorta / SMV / splenic / portal / IVC centerlines reused from si_centerlines_v1.json; generated (schematic, not anatomical data): proper hepatic artery tail, intrahepatic portal / arterial / hepatic-vein trees (space colonisation inside the liver mesh), sinusoid links, magnified lobule model. Branch radii follow r = r_leaf * n^(1/2.7) (schematic).',
           segments=OUTSEG, lobule=lobule, calibers=cal, named=named)
json.dump(doc, open(OUT, 'w'), separators=(',', ':'), ensure_ascii=False)
import os; print('wrote', OUT, os.path.getsize(OUT) // 1024, 'KB |', len(OUTSEG), 'segments | total length %.2f m' % tot_len)

if PLOT:
    import matplotlib; matplotlib.use('Agg'); import matplotlib.pyplot as plt
    col = lambda sid: ('#1f4fd8' if sid.startswith('pt') else '#d11' if sid.startswith('at') or sid.startswith('lb_arter') or sid == 'trunk_ha' else '#0aa' if sid.startswith('ht') else '#b84' if sid.startswith('sn') or sid.startswith('lb_sin') else '#5a2' if sid.startswith('lb') else '#888')
    fig, axs = plt.subplots(1, 3, figsize=(21, 8))
    for a_, (i, j, t) in zip(axs, [(0, 1, 'front x/y'), (2, 1, 'side z/y'), (0, 2, 'top x/z')]):
        a_.scatter(LP[:, i], LP[:, j], s=1, c='#caa', alpha=.4)
        for sid, d in OUTSEG.items():
            if sid in ('aorta', 'smv', 'splenic', 'ivc_lower', 'ivc_upper'): c, lw = '#888', 1
            else: c = col(sid); lw = 0.6 if sid.startswith(('sn', 'lb_sin')) else 1.8
            P = np.array(d['points']); a_.plot(P[:, i], P[:, j], c=c, lw=lw)
        a_.set_aspect('equal'); a_.set_title(t); a_.grid(alpha=.3); a_.set_xlim(0.1, -0.13) if i == 0 else None
    os.makedirs(PLOT, exist_ok=True); plt.savefig(PLOT + '/liver_build.png', dpi=70); print('plot ->', PLOT + '/liver_build.png')
