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
  * 口徑：主幹取文獻（見 sources.md「肝臟場景」）；分支用 Murray 定律 r = r_終端 × (終端數)^(1/3) 逐級推算（示意，不是量測值）。
  * 接點（2026-11-23 起，照接力指南 5b／5c）：半徑沿路由粗漸細且在接點連續；最大的子管與母管同軸續行、其餘貼壁分出；子管沿母管切線離開（depart／arrive）；
    同軸接點不封口（capStart／capEnd=false），圓頭只留在游離末端。血流方向＝點的排列順序。
需要：numpy、scipy。固定亂數種子，可重複執行。
"""
import json, sys, math
import numpy as np
from scipy.spatial import cKDTree
from scipy.interpolate import CubicSpline

args = [a for a in sys.argv[1:] if not a.startswith('--')]
WORLD, SI, OUT = args[:3]
PLOT = sys.argv[sys.argv.index('--plot') + 1] if '--plot' in sys.argv else None
rng = np.random.default_rng(20261122)
E_EXP = 3.0            # 分支口徑法則的指數：Murray 定律（母管半徑³＝子管半徑³ 之和）；2026-11-23 起與腎、肺一致（先前用 2.7）
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

# ---------------------------------------------------------------- 口徑（公尺）與接點
# 接點畫法照 docs/ht3d_接力指南.md 第 5b／5c 節（腎、肺同一套；2026-11-23 老師要求：由粗到細、不要「套管子」）：
#  ① 半徑連續，依 Murray 定律（母管半徑³＝子管半徑³ 之和）：終端數 n 的管，半徑 ＝ r_終端 × n^(1/3)；每一段沿路由粗漸變細，不是等粗的水管；
#  ② 接點切線相接（depart／arrive）：子管先沿母管末端的切線走一小段，再轉回自己的走向，分支像從幹線慢慢分出去；
#  ③ 最大的子管與母管同軸、同半徑接續（母管整段漸細到那個半徑）；其餘子管貼著母管壁分出（起點往分支那一側偏 (r大−r小)×0.85）；
#  ④ 同軸接點兩端都不封口（capStart／capEnd = false），圓頭只留在游離末端。
R_PORTAL_HILUM = 4.6e-3    # 門靜脈進肝門處（直徑約 9.2 mm；文獻正常 7–13 mm，平均約 9.6–10.3 mm）
R_RHV = 4.4e-3             # 右肝靜脈（直徑 8.8 mm；一項超音波研究平均 8.6 mm）
R_HA_HILUM = 1.6e-3        # 固有肝動脈（直徑約 3.2 mm，示意）
M3 = 1.0 / E_EXP
leaf = {0: R_PORTAL_HILUM / nP ** M3, 1: R_RHV / max(nR, 1) ** M3}; leaf[2] = leaf[1]
leaf_a = R_HA_HILUM / nP ** M3
print('r_leaf portal %.2f mm, hv %.2f mm, artery %.2f mm (Murray)' % (leaf[0] * 1e3, leaf[1] * 1e3, leaf_a * 1e3))

OUTSEG = {}
def put(sid, P, R, kind, o2, source, schematic=True, **extra):
    OUTSEG[sid] = dict(kind=kind, o2=o2, source=source, schematic=schematic, points=np.round(np.asarray(P), 5).tolist(), radius=np.round(np.asarray(R), 6).tolist(), **extra)
def seg_poly(s):
    P = np.array([P_[i] for i in s['nodes']]); P = smooth_poly(P, 3) if len(P) > 3 else P
    return resample(P, 0.004, keep_n=max(3, int(round(arclen(P)[-1] / 0.004)) + 1))

# ---- 接點用的小工具（與 build_lung_centerlines.py 同義）
def sp_res(P, step=0.003):
    """三次樣條穿過所有點、再依弧長等距重取樣（端點不動）"""
    P = np.asarray(P, float); d = arclen(P); keep = np.r_[True, np.diff(d) > 1e-9]; P = P[keep]; d = d[keep]
    n = max(3, int(round(d[-1] / step)) + 1); s = np.linspace(0, d[-1], n)
    if len(P) < 4: return np.stack([np.interp(s, d, P[:, k]) for k in range(3)], 1)
    return CubicSpline(d, P, bc_type='natural')(s)
def depart(P, T, ell):
    """路徑起點改成沿切線 T 離開，到弧長 ell 處才完全回到原本的走向（smoothstep 混合）；點數不變"""
    P = np.asarray(P, float); c = arclen(P); T = unit(T); ell = max(1e-4, min(ell, 0.6 * c[-1])); w = smoothstep(c / ell)[:, None]
    Q = (1 - w) * (P[0] + T[None, :] * c[:, None]) + w * P; Q[0] = P[0]; return Q
def arrive(P, T, ell):
    """路徑終點改成沿切線 T 進入（depart 的鏡像）"""
    return depart(np.asarray(P, float)[::-1], -np.asarray(T, float), ell)[::-1]
def min_curv_radius(P):
    """點列的最小曲率半徑（點間距÷轉角）"""
    P = np.asarray(P, float); a = P[1:-1] - P[:-2]; b = P[2:] - P[1:-1]; la = np.linalg.norm(a, axis=1); lb = np.linalg.norm(b, axis=1)
    ang = np.arccos(np.clip((a * b).sum(1) / (la * lb + 1e-15), -1, 1)); return float((0.5 * (la + lb) / np.maximum(ang, 1e-9)).min())
def bez_t(P0, T0, P3, T3, side=None, n=40):
    """兩端切線都對齊（離開 T0、抵達 T3）的 Bezier；控制點長度在 0.25–1.2 倍兩端距離間搜尋，取「最小曲率半徑最大」的（回頭彎也不會打結）。side：可選的側偏向量（原本的亂數側偏）"""
    P0 = np.asarray(P0, float); P3 = np.asarray(P3, float); D = float(np.linalg.norm(P3 - P0)); sd_ = 0 if side is None else side; best = None
    for a in (0.25, 0.35, 0.45, 0.6, 0.8, 1.0, 1.2):
        for b in (0.25, 0.35, 0.45, 0.6, 0.8, 1.0, 1.2):
            B = bez(P0, P0 + unit(T0) * a * D + sd_, P3 - unit(T3) * b * D - sd_, P3, n); q = min_curv_radius(B)
            if best is None or q > best[0] * 1.02: best = (q, B)
    return best[1]
def join_from(P, T, ell):
    """路徑起點沿切線 T 離開：起點到「弧長 ell 處的原路徑點 Q」之間改成兩端切線都對齊的 Bezier，Q 之後照原路徑。
    比 depart 的線性混合好：離開方向與原走向差很大（約 90°）時不會先衝出去再折回（S 形），轉彎半徑也夠大。"""
    P = np.asarray(P, float); c = arclen(P); iq = int(np.clip(np.searchsorted(c, ell), 2, len(P) - 2)) if len(P) > 4 else len(P) - 1
    if iq >= len(P) - 1: iq = len(P) - 2
    Q = P[iq]; tQ = unit(P[iq + 1] - P[iq - 1]); D = float(np.linalg.norm(Q - P[0]))
    B = bez_t(P[0], T, Q, tQ, None, 24)
    return np.vstack([B, P[iq + 1:]])
def gtaper(P, a, b):
    """沿弧長由 a 等比漸變到 b（兩端以 smoothstep 緩和）：由粗變細不會在某一處突然變細"""
    c = arclen(P); t = 0.6 * smoothstep(c / c[-1]) + 0.4 * (c / c[-1]); return a * (b / a) ** t
def tail_taper(R, P, r_end, Lt):
    """最後 Lt 公尺內半徑平滑收到 r_end（只變細、不變粗）"""
    R = np.asarray(R, float); c = arclen(P); Lt = max(1e-4, min(Lt, 0.6 * c[-1])); w = smoothstep((c - (c[-1] - Lt)) / Lt); return (1 - w) * R + w * np.minimum(R, r_end)
def tan_end(P, k=3): P = np.asarray(P, float); return unit(P[-1] - P[-1 - min(k, len(P) - 1)])
def mid_profile(n, a, mid, c):
    """微血管型半徑：兩端 a／c（接點略粗）、中段 mid（最細）"""
    t = np.linspace(0, 1, n); return mid + (a - mid) * (1 - smoothstep(t / 0.45)) + (c - mid) * smoothstep((t - 0.55) / 0.45)
def kids_sorted(i): return sorted(segs[i]['kids'], key=lambda k: (-segs[k]['n'], k))
def fan(Pend, T, ks, raw, leafr, r_big, parent=None):
    """母管末端（位置 Pend、末端切線 T）分出 ks：最大的同軸續行；其餘貼壁分出。回傳 {子段: 最終路徑}
    parent=(母管路徑, 母管半徑)：肝門這種「T 形」分叉，較小的那支改從末端前 ~2 倍管徑處的管壁側面分出（沿母管當地切線離開），不是在末端硬轉 90°。"""
    out = {}
    for j, k in enumerate(ks):
        P0 = np.array(raw[k], float)
        r_k = leafr * segs[k]['n'] ** M3; Tk, Ok = T, Pend
        if j > 0:
            if parent is not None:                           # 側支：起點在母管末端前 s_b 處
                Pp_, Rp_ = parent; cp = arclen(Pp_); sb = min(0.5 * cp[-1], 2.2 * float(Rp_[-1]) + 0.004); ib = int(np.searchsorted(cp, cp[-1] - sb))
                Ok = Pp_[ib]; Tk = unit(Pp_[min(ib + 2, len(Pp_) - 1)] - Pp_[max(ib - 2, 0)]); rp_b = float(Rp_[ib])
            else: rp_b = r_big
            d = unit(P0[min(4, len(P0) - 1)] - P0[0]); perp = d - (d @ Tk) * Tk; nrm = np.linalg.norm(perp)
            perp = perp / nrm if nrm > 1e-6 else unit(np.cross(Tk, [0.3, 0.8, 0.5]))
            P0[0] = Ok + perp * 0.85 * max(0.0, rp_b - r_k)
        out[k] = sp_res(join_from(P0, Tk, min(0.45 * arclen(P0)[-1], max(0.012, 7.0 * r_k))), 0.003)   # 粗管用較長的接合距離，轉彎才圓
    return out
def grow(i, Pi, leafr, raw, FP, FR):
    """已知第 i 段的最終路徑 Pi：定它的半徑（由 r_i 漸細到最大子管的半徑），再展開它的子段"""
    s = segs[i]; r_i = leafr * s['n'] ** M3; ks = kids_sorted(i); FP[i] = Pi
    if not ks: FR[i] = np.full(len(Pi), r_i); return
    r_big = leafr * segs[ks[0]]['n'] ** M3; FR[i] = gtaper(Pi, r_i, r_big)
    for k, Pk in fan(Pi[-1], tan_end(Pi), ks, raw, leafr, r_big).items(): grow(k, Pk, leafr, raw, FP, FR)

# ---- 真實網格中心線（沿用）：主動脈（到腹腔動脈幹起點）、腸繫膜上靜脈、脾靜脈、門靜脈、下腔靜脈
ap = np.array(S0['aorta']['points']); ar = np.array(S0['aorta']['radius']); c0 = np.array(S0['hep_artery']['points'][0])
kc = int(np.argmin(np.linalg.norm(ap - c0, axis=1)))
put('aorta', ap[:kc + 1], ar[:kc + 1], 'artery', 'rich', 'mesh: aorta (to coeliac trunk origin)', False)
OUTSEG['smv'] = dict(S0['smv'], capEnd=False)                  # 與門靜脈同軸接續，不封口
sp_P = np.array(S0['splenic']['points']); pp = np.array(portal0['points'])
sp_P2 = arrive(sp_P, unit(pp[3] - pp[0]), 0.014)               # 脾靜脈末 14 mm 順著門靜脈方向併入（不是垂直插入）
OUTSEG['splenic'] = dict(S0['splenic'], points=np.round(sp_P2, 5).tolist(), capEnd=False)
for k in ('ivc_lower', 'ivc_upper'): OUTSEG[k] = dict(S0[k])
OUTSEG['ivc_lower']['capEnd'] = False; OUTSEG['ivc_upper']['capStart'] = False; OUTSEG['ivc_upper']['capEnd'] = False
# 門靜脈：腸繫膜上靜脈末端半徑接過來（4.75 mm）→ 稍粗（5.0 mm）→ 肝門 4.6 mm → 末段漸細到「右支」的半徑；進肝後的分支在下面一起建
r_smv = float(np.array(S0['smv']['radius'])[-1]); cpp = arclen(pp); tt = cpp / cpp[-1]
pr = np.where(tt < 0.2, r_smv + (5.0e-3 - r_smv) * smoothstep(tt / 0.2), 5.0e-3 + (R_PORTAL_HILUM - 5.0e-3) * (tt - 0.2) / 0.8)

# ---- 腹腔動脈幹→肝總動脈（網格）→固有肝動脈（示意）→肝門
hp = np.array(S0['hep_artery']['points']); hr = np.array(S0['hep_artery']['radius']); kcut = 36
pha = bez(hp[kcut], hp[kcut] + np.array([0.0, 0.020, -0.004]), H_ART - np.array([0.0, 0.022, 0.0]), H_ART, 14)
ha_trunk_P = np.vstack([hp[:kcut + 1], pha[1:]]); ha_trunk_R = np.r_[hr[:kcut + 1], np.linspace(hr[kcut], R_HA_HILUM, len(pha) - 1)]
ha_trunk_P = resample(ha_trunk_P, 0.003); ha_trunk_R = np.interp(np.linspace(0, 1, len(ha_trunk_P)), np.linspace(0, 1, len(ha_trunk_R)), ha_trunk_R)

# ---- 肝內三種樹
nm = {0: 'pt', 1: 'ht', 2: 'ht'}; seg_id = {}; counters = {}
def new_id(prefix, depth):
    d = min(depth, 6); counters[(prefix, d)] = counters.get((prefix, d), 0) + 1; return '%s%d_%d' % (prefix, d, counters[(prefix, d)])   # 第 6 層以後共用 6（流速、密度同一組），編號仍不重複
polys = {}
for i, s in enumerate(segs):
    seg_id[i] = new_id(nm[s['tree']], s['depth']); polys[i] = seg_poly(s)          # 原始（未接點處理）路徑：選肝小葉位置與肝竇連接時沿用，編號與位置不變
# 門靜脈樹
FPp, FRp = {}, {}
ks0 = sorted(top[0], key=lambda k: (-segs[k]['n'], k)); rbig_p = leaf[0] * segs[ks0[0]]['n'] ** M3
pr = tail_taper(pr, pp, rbig_p, 0.014)
d_big = unit(polys[ks0[0]][min(4, len(polys[ks0[0]]) - 1)] - polys[ks0[0]][0])
pp = arrive(pp, unit(0.2 * tan_end(pp) + 0.8 * d_big), 0.025)        # 門靜脈末 25 mm 順勢彎向最大的子支（右支），像一條連續的血管，不是直直撞上去
for k, Pk in fan(pp[-1], tan_end(pp), ks0, polys, leaf[0], rbig_p, parent=(pp, pr)).items(): grow(k, Pk, leaf[0], polys, FPp, FRp)
put('portal', pp, pr, 'vein', 'poor', 'mesh: hepatic_portal_vein_2 (centerline) | caliber: literature, see sources.md', False, tube=True, capStart=False, capEnd=False)
# 動脈樹：伴著門靜脈分支（口徑較細，位置沿用門靜脈段偏一個固定方向，起點接上一段動脈的終點）
rawA, art_end = {}, {}
for i in sorted([i for i, s in enumerate(segs) if s['tree'] == 0], key=lambda k: segs[k]['depth']):
    s = segs[i]; P, Rp = FPp[i], FRp[i]; n = len(P); Ra_m = leaf_a * s['n'] ** M3
    t = unit(P[-1] - P[0]); ref = np.array([0, 0, 1.0]) if abs(t[2]) < 0.9 else np.array([1.0, 0, 0]); n1 = unit(np.cross(t, ref)); n2 = np.cross(t, n1)
    ang = (i * 2.399963) % (2 * math.pi); off = (math.cos(ang) * n1 + math.sin(ang) * n2) * (Rp.mean() + 1.15 * Ra_m + 0.0004)
    start = art_end[s['parent']] if s['parent'] is not None else H_ART
    u = np.linspace(0, 1, n)[:, None]; blend = smoothstep(u / 0.4); o = (1 - blend) * (start - P[0]) + blend * off
    Pa = P + o; Pa[0] = start
    rawA[i] = Pa; art_end[i] = Pa[-1]
FPa, FRa = {}, {}
ks0a = sorted(top[0], key=lambda k: (-segs[k]['n'], k)); rbig_a = leaf_a * segs[ks0a[0]]['n'] ** M3
ha_trunk_R = tail_taper(ha_trunk_R, ha_trunk_P, rbig_a, 0.008)
d_bigA = unit(rawA[ks0a[0]][min(4, len(rawA[ks0a[0]]) - 1)] - rawA[ks0a[0]][0])
ha_trunk_P = arrive(ha_trunk_P, unit(0.3 * tan_end(ha_trunk_P) + 0.7 * d_bigA), 0.015)
for k, Pk in fan(ha_trunk_P[-1], tan_end(ha_trunk_P), ks0a, rawA, leaf_a, rbig_a, parent=(ha_trunk_P, ha_trunk_R)).items(): grow(k, Pk, leaf_a, rawA, FPa, FRa)
put('trunk_ha', ha_trunk_P, ha_trunk_R, 'artery', 'rich', 'mesh: coeliac_trunk+common_hepatic_artery (to its end) + generated proper hepatic artery to the hilum', True, tube=True, capStart=False, capEnd=False)
# 肝靜脈樹（樹的幾何與門靜脈樹相同；匯流方向相反，輸出時整段反轉）
FPh, FRh = {}, {}
for r_ in top[1] + top[2]: grow(r_, sp_res(polys[r_], 0.003), leaf[segs[r_]['tree']], polys, FPh, FRh)

def put_pt(i, R=None, capEnd=None):
    s = segs[i]; put(seg_id[i], FPp[i], FRp[i] if R is None else R, 'vein', 'poor', 'generated: schematic portal-vein branch (space colonisation inside liver mesh)', True, tube=True, level=s['depth'], terminals=s['n'], capStart=False, capEnd=(not s['kids']) if capEnd is None else capEnd)
def put_at(i, R=None, capEnd=None):
    s = segs[i]; put('at' + seg_id[i][2:], FPa[i], FRa[i] if R is None else R, 'artery', 'rich', 'generated: schematic hepatic-artery branch accompanying the portal branch', True, tube=True, level=s['depth'], terminals=s['n'], capStart=False, capEnd=(not s['kids']) if capEnd is None else capEnd)
for i, s in enumerate(segs):
    if s['tree'] == 0: put_pt(i)
for i in sorted([i for i, s in enumerate(segs) if s['tree'] == 0], key=lambda k: segs[k]['depth']): put_at(i)
ivc_pts = np.array(S0['ivc_lower']['points']); ivc_rad = np.array(S0['ivc_lower']['radius'])
# 肝靜脈：流向＝往下腔靜脈，所以把 root→leaf 的點序反轉；游離的葉端留圓頭，往下腔靜脈那一端不封口
for i, s in enumerate(segs):
    if s['tree'] == 0: continue
    P2, R2 = FPh[i][::-1], FRh[i][::-1]
    if s['depth'] == 0:                                   # 主幹：往下腔靜脈軸再延伸，讓管子一定進到下腔靜脈壁裡（之後依 tubeRange 在管壁處截斷）
        kk = int(np.argmin(np.linalg.norm(ivc_pts - P2[-1], axis=1))); P2 = np.vstack([P2, ivc_pts[kk]]); R2 = np.r_[R2, R2[-1]]
    put(seg_id[i], P2, R2, 'vein', 'poor', 'generated: schematic hepatic-vein branch (flow toward the IVC)', True, tube=True, level=s['depth'], terminals=s['n'], tree=s['tree'], capStart=(not s['kids']), capEnd=False)
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
hv_pts = [(i, polys[i]) for i in hv_ids]                  # 原始路徑：只用來選位置（編號與先前版本一致）；實際連接點改取最終路徑上最近的點


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
# 小葉的血管口徑：門靜脈終端分成 3 條（Murray：每條 = 終端半徑 × 3^(-1/3)），動脈同理；之後沿路逐漸變細（血被肝竇分走）
r_fv = float(FRp[ip][-1]) * 3 ** (-M3); r_fa = float(FRa[ip][-1]) * 3 ** (-M3)
T_pt, T_at = tan_end(FPp[ip]), tan_end(FPa[ip])
FPj_q = FPh[jq]; kq_f = int(np.argmin(np.linalg.norm(FPj_q - QS, axis=1))); QSf = FPj_q[kq_f]       # 中央靜脈接上的點：取最終路徑上最近的一點
Tflow_q = unit(FPj_q[max(kq_f - 3, 0)] - FPj_q[min(kq_f + 3, len(FPj_q) - 1)])
ang0 = math.pi / 2
tract = []
for k in range(3):
    th = ang0 + k * 2 * math.pi / 3; rad = (math.cos(th) * e1 + math.sin(th) * e2) * RHO
    tang = (-math.sin(th) * e1 + math.cos(th) * e2)
    zs = np.linspace(-HH, HH, 9); wob = 0.0006 * np.sin(zs / HH * 3.0 + k)[:, None] * tang
    venule = Cc + rad + zs[:, None] * ax + wob; art = Cc + rad * 1.0 + zs[:, None] * ax + tang * 0.0021 + wob
    tract.append((venule, art, th))
    put('lb_venule%d' % k, venule, gtaper(venule, r_fv, 0.72 * r_fv), 'vein', [0.0, 0.0], 'generated: schematic portal venule of a magnified lobule', True, tube=True, capStart=False, capEnd=True)
    put('lb_arteriole%d' % k, art, gtaper(art, r_fa, 0.78 * r_fa), 'artery', 'rich', 'generated: schematic hepatic arteriole of a magnified lobule', True, tube=True, capStart=False, capEnd=True)
    dfb = float(np.linalg.norm(venule[0] - PS))                                    # 離開方向＝終端分支末端切線、抵達方向＝小葉軸（回頭彎：控制點拉長到兩端距離的 0.55 倍）
    fb = sp_res(bez_t(PS, T_pt, venule[0], ax), 0.0012)
    put('lb_feed_v%d' % k, fb, np.full(len(fb), r_fv), 'vein', 'poor', 'generated: feeder from the terminal portal branch to the lobule', True, tube=True, capStart=False, capEnd=False)
    dfa = float(np.linalg.norm(art[0] - AS))
    fa = sp_res(bez_t(AS, T_at, art[0], ax), 0.0012)
    put('lb_feed_a%d' % k, fa, np.full(len(fa), r_fa), 'artery', 'rich', 'generated: feeder from the terminal hepatic-artery branch to the lobule', True, tube=True, capStart=False, capEnd=False)
cv = np.vstack([Cc - ax * (HH + 0.0015), Cc, Cc + ax * HH, bez(Cc + ax * HH, Cc + ax * (HH + 0.004), QSf - ax * 0.004, QSf, 8)[1:]])
cvP = sp_res(cv, 0.0015); cvP = sp_res(arrive(cvP, Tflow_q, 0.008), 0.0015)         # 順著肝靜脈的血流方向併入
put('lb_central', cvP, gtaper(cvP, 0.00062, 0.00115), 'vein', 'poor', 'generated: schematic central vein of a magnified lobule', True, tube=True, capStart=True, capEnd=True)
SIN_MID, SIN_END = 0.00022, 0.00028; nsin = 0
for k, (venule, art, th) in enumerate(tract):
    for m in range(17):
        from_art = m % 4 == 3                              # 約四分之一的肝竇由肝動脈小分支起頭
        src = art if from_art else venule; t0 = rng.uniform(0.06, 0.94); i0 = t0 * (len(src) - 1)
        a_ = src[int(i0)] + (src[min(len(src) - 1, int(i0) + 1)] - src[int(i0)]) * (i0 - int(i0))
        t1 = float(np.clip(t0 + rng.normal(0, 0.12), 0.04, 0.96)); b_ = Cc + ax * ((t1 * 2 - 1) * HH * 0.95)
        mid = (a_ + b_) / 2; side = unit(np.cross(ax, b_ - a_)) * rng.normal(0, 0.0012)
        c1 = a_ + (b_ - a_) * 0.30 + side + ax * rng.normal(0, 0.0007); c2 = a_ + (b_ - a_) * 0.70 - side * 0.6 + ax * rng.normal(0, 0.0007)
        P = bez(a_, c1, c2, b_, 9)
        nsin += 1; put('lb_sin_%d' % nsin, P, mid_profile(len(P), SIN_END, SIN_MID, SIN_END), 'sinusoid', [1.0, 0.45] if from_art else [0.0, 0.45], 'generated: schematic sinusoid of a magnified lobule (real diameter ~10 micrometres)', True, tube=True, capStart=False, capEnd=False)
# 肝小葉所在的終端分支：末段收到 3 條小葉進口的半徑，三條同軸同半徑出發
put_pt(ip, tail_taper(FRp[ip], FPp[ip], r_fv, max(0.008, 1.6 * float(FRp[ip][-1]))), True)
put_at(ip, tail_taper(FRa[ip], FPa[ip], r_fa, max(0.006, 1.6 * float(FRa[ip][-1]))), True)

# ---------------------------------------------------------------- 肝竇連接（巨觀示意）：每個門靜脈終端與動脈終端接到附近的肝靜脈分支
# 終端分支末段先收到連接管的起點半徑（Murray：n 條 → 終端半徑 × n^(-1/3)），連接管同軸同半徑出發，中段最細（肝竇），再略粗併入肝靜脈分支側壁
SN_MID, SN_END = 0.00022, 0.00032; nsn = 0
for i in leaf_nodes:
    if i == ip: continue
    for kd, tip, o2s, count, Pf, Rf in (('p', FPp[i][-1], 0.0, 2, FPp[i], FRp[i]), ('a', art_end[i], 1.0, 1, FPa[i], FRa[i])):
        ds = []
        for j, Pj in hv_pts:
            k = int(np.argmin(np.linalg.norm(Pj - tip, axis=1))); ds.append((np.linalg.norm(Pj[k] - tip), j, k))
        ds.sort(); used = set(); acc = []
        for dist, j, k in ds:
            if len(used) >= count or dist > 0.045 or dist < 0.007 or j in used: continue
            if j == jq and np.linalg.norm(tip - PS) < 0.02: continue
            used.add(j); end = hv_pts[[x for x, _ in hv_pts].index(j)][1][k]
            side = unit(np.cross(unit(end - tip), [0.3, 0.8, 0.5])) * dist * rng.uniform(-0.25, 0.25)
            acc.append((j, end, side))
        n_acc = len(acc); r_leaf_ = float(Rf[-1]); r_s = r_leaf_ * max(n_acc, 1) ** (-M3); Tt = tan_end(Pf)
        for j, end, side in acc:
            FPj = FPh[j]; kf = int(np.argmin(np.linalg.norm(FPj - end, axis=1))); Ef = FPj[kf]
            Tflow = unit(FPj[max(kf - 3, 0)] - FPj[min(kf + 3, len(FPj) - 1)])
            D = float(np.linalg.norm(Ef - tip))                                    # 兩端切線都對齊（離開＝終端分支切線、抵達＝肝靜脈血流方向），側偏量沿用原本的亂數
            P = sp_res(bez_t(tip, Tt, Ef, Tflow, side * 0.5), 0.002)
            nsn += 1; put('sn_%d' % nsn, P, mid_profile(len(P), r_s, SN_MID, SN_END), 'sinusoid', [o2s, 0.45], 'generated: schematic sinusoid link (terminal branch to hepatic-vein branch)', True, tube=True, capStart=False, capEnd=False)
        # 終端分支：末段收到連接管起點的半徑；末端一律封圓頭（肝竇連接管在步驟①②是隱藏的，不封的話樹梢會像被切斷；步驟④連接管同軸接在圓頭裡，看不出接縫）
        Rn = tail_taper(Rf, Pf, r_s, max(0.008, 1.6 * r_leaf_)) if n_acc >= 2 else Rf
        (put_pt if kd == 'p' else put_at)(i, Rn, True)
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
