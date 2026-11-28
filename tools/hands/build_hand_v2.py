"""卡通手 v2：用「距離場（SDF）＋平滑聯集」建模，再用 Cycles 平塗渲染。

做法摘要（給日後接手的 Claude）：
  1. 依姿勢角度算出各指節的骨架（關節點、方向、半徑）→ kinematics()
  2. 用 SDF 把手掌、魚際、小魚際、虎口皮膜、前臂、各指節「平滑聯集」成一整塊肉
     （手指和手掌只在指根處平滑融合；手指與手指、指尖與掌心之間是「硬聯集」，
      所以握拳時每根手指仍是一根一根分開的）→ HandSDF
  3. marching cubes 取等值面 → 細分 → 投影回 SDF 表面（表面又圓又準）→ make_mesh()
  4. 在每個頂點算「紋路距離」：指節橫紋、手背指節皺紋、掌紋、指甲、
     以及「兩塊肉互相貼住」的接觸線（握拳時的指縫線）→ 存成頂點屬性
  5. Cycles：自製平塗著色（亮/暗兩階＋輕微 AO）＋紋路著色＋Freestyle 外框描邊。

座標：單位 cm；右手；手掌朝 -Z、手背 +Z、手指朝 +Y、拇指在 -X；手腕在 y≈0。
四指角度 (外展, MCP, PIP, DIP)，單位度，彎曲＝朝掌心；外展＞0＝離開中指張開（中指＞0 偏向食指）。
拇指角度 (abd, palm, roll, mcp, ip)：
  abd  = 在掌面內往 -X 張開的角度（0=貼著食指方向，60=大張）
  palm = 往掌心方向（-Z）抬出的角度（掌側外展）
  roll = 繞拇指自身軸的旋轉（負值＝指腹轉向四指）
  mcp, ip = 拇指第一、第二關節彎曲
"""
import math
import numpy as np

# ====== 膚色（集中一個參數，日後只改這裡）======
SKIN_HEX = "#F2A47F"        # 亮面膚色（sRGB）
SHOW_NAILS = True           # 是否畫指甲

D = math.radians


# ---------------------------------------------------------------- 小工具
def rx(a):
    c, s = math.cos(a), math.sin(a)
    return np.array([[1, 0, 0], [0, c, -s], [0, s, c]], float)


def ry(a):
    c, s = math.cos(a), math.sin(a)
    return np.array([[c, 0, s], [0, 1, 0], [-s, 0, c]], float)


def rz(a):
    c, s = math.cos(a), math.sin(a)
    return np.array([[c, -s, 0], [s, c, 0], [0, 0, 1]], float)


def nrm(v):
    v = np.asarray(v, float)
    return v / np.linalg.norm(v)


def smin(a, b, k):
    """多項式平滑聯集；k 可為陣列（各處融合程度不同），k≈0 時退化為硬聯集。"""
    k = np.maximum(k, 1e-5)
    h = np.maximum(k - np.abs(a - b), 0.0) / k
    return np.minimum(a, b) - h * h * k * 0.25


def smax(a, b, k):
    return -smin(-a, -b, k)


def sd_round_cone(p, a, b, r1, r2):
    """兩端半徑不同的圓錐膠囊（iq 精確 SDF），p:(N,3)。"""
    a = np.asarray(a, float); b = np.asarray(b, float)
    ba = b - a
    l2 = ba @ ba
    rr = r1 - r2
    a2 = l2 - rr * rr
    il2 = 1.0 / l2
    pa = p - a
    y = pa @ ba
    z = y - l2
    xv = pa * l2 - y[:, None] * ba
    x2 = np.einsum('ij,ij->i', xv, xv)
    y2 = y * y * l2
    z2 = z * z * l2
    k = np.sign(rr) * rr * rr * x2
    d_end = np.sqrt(x2 + z2) * il2 - r2
    d_start = np.sqrt(x2 + y2) * il2 - r1
    d_mid = (np.sqrt(np.maximum(x2 * a2 * il2, 0)) + y * rr) * il2 - r1
    return np.where(np.sign(z) * a2 * z2 > k, d_end,
                    np.where(np.sign(y) * a2 * y2 < k, d_start, d_mid))


def sd_ellipsoid(p, c, r, R=None):
    """橢球（近似 SDF）。R 的三個欄向量＝橢球區域座標軸。"""
    q = p - np.asarray(c, float)
    if R is not None:
        q = q @ R
    r = np.asarray(r, float)
    k0 = np.linalg.norm(q / r, axis=1)
    k1 = np.linalg.norm(q / (r * r), axis=1)
    return k0 * (k0 - 1.0) / np.maximum(k1, 1e-9)


def ud_triangle(p, a, b, c):
    a, b, c = (np.asarray(v, float) for v in (a, b, c))
    ba, cb, ac = b - a, c - b, a - c
    pa, pb, pc = p - a, p - b, p - c
    nor = np.cross(ba, ac)
    s = (np.sign(pa @ np.cross(ba, nor)) + np.sign(pb @ np.cross(cb, nor))
         + np.sign(pc @ np.cross(ac, nor)))

    def seg2(e, pe):
        t = np.clip((pe @ e) / (e @ e), 0, 1)
        v = e[None, :] * t[:, None] - pe
        return np.einsum('ij,ij->i', v, v)
    edge = np.minimum(np.minimum(seg2(ba, pa), seg2(cb, pb)), seg2(ac, pc))
    face = (pa @ nor) ** 2 / (nor @ nor)
    return np.sqrt(np.where(s < 2, edge, face))


def seg_closest(p, a, b):
    """點到線段的最近參數 t 與距離。"""
    ab = b - a
    t = np.clip(((p - a) @ ab) / (ab @ ab), 0, 1)
    q = a + t[:, None] * ab
    return t, np.linalg.norm(p - q, axis=1)


# ---------------------------------------------------------------- 手的尺寸（卡通圓胖比例）
# base=MCP 關節位置, L=三節長度（遠節只算到指尖球心，外面還有半徑那一截）,
# r=四個半徑（MCP, PIP, DIP, 指尖球）, abd0=自然外展角
FINGERS = {
    'index':  dict(base=(-2.85, 8.55, 0.05), L=(3.65, 2.30, 1.35), r=(1.22, 1.15, 1.09, 1.06), abd0=4.0, sgn=1),
    'middle': dict(base=(-0.95, 8.95, 0.10), L=(3.90, 2.50, 1.45), r=(1.25, 1.18, 1.12, 1.08), abd0=0.5, sgn=1),
    'ring':   dict(base=(0.95, 8.70, 0.05),  L=(3.70, 2.40, 1.37), r=(1.21, 1.14, 1.08, 1.05), abd0=-3.5, sgn=-1),
    'pinky':  dict(base=(2.78, 8.00, -0.05), L=(2.95, 1.85, 1.20), r=(1.10, 1.04, 0.99, 0.96), abd0=-9.0, sgn=-1),
}
FINGER_NAMES = ['index', 'middle', 'ring', 'pinky']
# 拇指：CMC 位置、三節長度（掌骨、近節、遠節到指尖球心）、四個半徑
THUMB = dict(base=(-1.70, 1.45, -0.55), L=(3.70, 2.35, 1.40), r=(1.52, 1.40, 1.28, 1.16))
WRIST_CUT_Y = -3.6          # 前臂切口位置（y）
PALM_CENTER = (0.0, 4.6, 0.0)   # 相機對準點（手的座標）


# ---------------------------------------------------------------- 運動學
def finger_chain(name, abd, mcp, pip, dip):
    g = FINGERS[name]
    p = np.array(g['base'], float)
    R = rz(D(g['abd0'] + g['sgn'] * abd)) @ rx(-D(mcp))
    joints, frames = [p.copy()], []
    for L, flex in zip(g['L'], (0.0, pip, dip)):
        if flex:
            R = R @ rx(-D(flex))
        frames.append(R.copy())
        p = p + R @ np.array([0, L, 0])
        joints.append(p.copy())
    return dict(J=joints, R=frames, r=g['r'], flex=(mcp, pip, dip), L=g['L'])


def thumb_chain(abd, palm, roll, mcp, ip):
    g = THUMB
    p = np.array(g['base'], float)
    R = rz(D(abd)) @ rx(-D(palm)) @ ry(D(roll))
    joints, frames = [p.copy()], []
    for L, flex in zip(g['L'], (0.0, mcp, ip)):
        if flex:
            R = R @ rx(-D(flex))
        frames.append(R.copy())
        p = p + R @ np.array([0, L, 0])
        joints.append(p.copy())
    return dict(J=joints, R=frames, r=g['r'], flex=(0, mcp, ip), L=g['L'])


def kinematics(pose):
    k = {n: finger_chain(n, *pose[n]) for n in FINGER_NAMES}
    k['thumb'] = thumb_chain(*pose['thumb'])
    return k


# ---------------------------------------------------------------- 距離場
class HandSDF:
    COMP = ['palm', 'index', 'middle', 'ring', 'pinky', 'thumb']

    def __init__(self, pose):
        self.pose = pose
        self.K = kinematics(pose)

    # 一根手指（三節圓錐膠囊＋掌側肉墊）
    def _finger(self, p, ch, pad=0.20):
        J, R, r = ch['J'], ch['R'], ch['r']
        d = None
        for i in range(3):
            s = sd_round_cone(p, J[i], J[i + 1], r[i], r[i + 1])
            # 掌側肉墊：往掌側（區域 -Z）偏移一點的細膠囊，讓指腹飽滿
            off = -R[i][:, 2] * pad
            a = J[i] + R[i] @ np.array([0, 0.15 * ch['L'][i], 0]) + off
            b = J[i + 1] - R[i] @ np.array([0, 0.12 * ch['L'][i], 0]) + off
            s2 = sd_round_cone(p, a, b, r[i] * 0.86, r[i + 1] * 0.86)
            s = smin(s, s2, 0.35)
            d = s if d is None else smin(d, s, 0.22)
        return d

    def _palm(self, p):
        th = self.K['thumb']
        ix = self.K['index']
        # 掌心主體：扁橢球（不是方板）
        d = sd_ellipsoid(p, (0.05, 4.55, -0.30), (3.85, 4.65, 1.95))
        # 指根橫樑（MCP 關節列）
        bi = np.array(FINGERS['index']['base']); bp = np.array(FINGERS['pinky']['base'])
        bm = np.array(FINGERS['middle']['base'])
        d = smin(d, sd_round_cone(p, bi + (0, -0.25, -0.1), bm + (0, -0.25, -0.05), 1.18, 1.2), 1.0)
        d = smin(d, sd_round_cone(p, bm + (0, -0.25, -0.05), bp + (0, -0.25, -0.1), 1.2, 1.08), 1.0)
        # 掌側指根肉墊
        d = smin(d, sd_round_cone(p, (-2.55, 7.55, -0.65), (2.45, 7.05, -0.7), 1.08, 1.02), 1.0)
        # 小魚際（小指側肌肉墊）
        Rh = rz(D(-6))
        d = smin(d, sd_ellipsoid(p, (2.45, 3.6, -0.55), (1.50, 3.1, 1.45), Rh), 1.3)
        # 前臂（扁橢圓截面），與手掌平滑相連，不會有接縫
        q = p.copy(); q[:, 2] = q[:, 2] / 0.70
        fa = sd_round_cone(q, (0, -8.0, -0.1), (0, 1.0, -0.25 / 0.7), 2.85, 2.60) * 0.80
        d = smin(d, fa, 2.0)
        # 拇指掌骨＋魚際（跟著拇指動）
        J, R, r = th['J'], th['R'], th['r']
        d = smin(d, sd_round_cone(p, J[0], J[1], r[0], r[1]), 1.4)
        c = J[0] + 0.50 * (J[1] - J[0]) - R[0][:, 2] * 0.45 + np.array([0.55, 0.15, 0])
        Rt = np.column_stack([nrm(np.cross(R[0][:, 1], [0, 0, 1])), R[0][:, 1], [0, 0, 1]])
        Rt[:, 0] = nrm(np.cross(Rt[:, 1], Rt[:, 2]))
        Rt[:, 2] = np.cross(Rt[:, 0], Rt[:, 1])
        d = smin(d, sd_ellipsoid(p, c, (1.85, 2.55, 1.45), Rt), 1.3)
        # 虎口皮膜：三角形加厚，連到拇指近節與食指近節
        A = np.array([-1.0, 4.6, -0.45])
        B = J[1] + 0.35 * (J[2] - J[1])
        C = ix['J'][0] + 0.18 * (ix['J'][1] - ix['J'][0]) + np.array([0, 0, -0.2])
        web = ud_triangle(p, A, B, C) - 0.80
        d = smin(d, web, 1.0)
        # 前臂切口：乾淨圓角斷面
        d = smax(d, -(p[:, 1] - WRIST_CUT_Y), 0.6)
        return d

    def components(self, p):
        """回傳 (N,6) 各部位的距離：palm, index, middle, ring, pinky, thumb(自由段)"""
        out = np.empty((len(p), 6), np.float32)
        out[:, 0] = self._palm(p)
        for i, n in enumerate(FINGER_NAMES):
            out[:, 1 + i] = self._finger(p, self.K[n])
        th = self.K['thumb']
        J, r = th['J'], th['r']
        t = sd_round_cone(p, J[1], J[2], r[1], r[2])
        t = smin(t, sd_round_cone(p, J[2], J[3], r[2], r[3]), 0.2)
        # 拇指指腹肉
        R = th['R']
        off = -R[2][:, 2] * 0.22
        t = smin(t, sd_round_cone(p, J[2] + off, J[3] + off - R[2][:, 1] * 0.1, r[2] * 0.85, r[3] * 0.85), 0.35)
        out[:, 5] = t
        return out

    def blend_k(self, p):
        """各手指與手掌的融合寬度：只在指根附近融合，離開指根就變硬聯集。"""
        ks = []
        for n in FINGER_NAMES:
            J = self.K[n]['J']
            dist = np.linalg.norm(p - J[0], axis=1)
            ks.append(0.85 * np.clip(1.0 - (dist - 0.6) / 1.4, 0, 1))
        J = self.K['thumb']['J']
        dist = np.linalg.norm(p - J[1], axis=1)
        ks.append(1.0 * np.clip(1.0 - (dist - 0.5) / 1.6, 0, 1))
        return ks

    def combine(self, C, ks):
        d = C[:, 0]
        for j in range(1, 6):
            d = smin(d, C[:, j], ks[j - 1])
        return d

    def __call__(self, p, chunk=300000):
        p = np.asarray(p, np.float64)
        out = np.empty(len(p), np.float64)
        for s in range(0, len(p), chunk):
            q = p[s:s + chunk]
            out[s:s + chunk] = self.combine(self.components(q), self.blend_k(q))
        return out

    def grad(self, p, eps=0.004):
        g = np.zeros_like(p)
        for i in range(3):
            e = np.zeros(3); e[i] = eps
            g[:, i] = (self(p + e) - self(p - e)) / (2 * eps)
        return g

    def bounds(self):
        pts = [np.array([[-4.5, WRIST_CUT_Y - 0.5, -2.5], [4.5, 10, 2.0]])]
        for n in FINGER_NAMES + ['thumb']:
            pts.append(np.array(self.K[n]['J']))
        P = np.vstack(pts)
        return P.min(0) - 1.8, P.max(0) + 1.8

    def raymarch(self, origin, direction, tmax=20.0):
        """從 origin 沿 direction 前進，回傳碰到皮膚表面的點（用來算錨點）。"""
        o = np.asarray(origin, float); dvec = nrm(direction)
        t = 0.0
        inside = self(o[None])[0] < 0
        for _ in range(400):
            q = o + dvec * t
            d = self(q[None])[0]
            if inside:
                if d > 0:
                    break
                t += max(-d, 0.01)
            else:
                if d < 1e-3:
                    break
                t += max(d, 0.005)
            if t > tmax:
                return None
        return o + dvec * t


# ---------------------------------------------------------------- 網格
def make_mesh(sdf, h=0.11, subdiv=True, relax=3):
    from skimage.measure import marching_cubes
    import scipy.sparse as sp
    lo, hi = sdf.bounds()
    xs = np.arange(lo[0], hi[0], h); ys = np.arange(lo[1], hi[1], h); zs = np.arange(lo[2], hi[2], h)
    G = np.stack(np.meshgrid(xs, ys, zs, indexing='ij'), -1).reshape(-1, 3)
    vol = sdf(G).reshape(len(xs), len(ys), len(zs)).astype(np.float32)
    V, F, _, _ = marching_cubes(vol, 0.0, spacing=(h, h, h))
    V = V + lo

    if subdiv:   # 每個三角形切成 4 個
        E = np.vstack([F[:, [0, 1]], F[:, [1, 2]], F[:, [2, 0]]])
        E.sort(1)
        Eu, inv = np.unique(E, axis=0, return_inverse=True)
        inv = inv.reshape(-1)
        mid = (V[Eu[:, 0]] + V[Eu[:, 1]]) / 2
        nV = len(V)
        V = np.vstack([V, mid])
        m = inv.reshape(3, -1).T + nV
        a, b, c = F[:, 0], F[:, 1], F[:, 2]
        ab, bc, ca = m[:, 0], m[:, 1], m[:, 2]
        F = np.vstack([np.stack([a, ab, ca], 1), np.stack([ab, b, bc], 1),
                       np.stack([ca, bc, c], 1), np.stack([ab, bc, ca], 1)])

    def project(V, it=3):
        for _ in range(it):
            d = sdf(V)
            g = sdf.grad(V)
            gg = np.maximum((g * g).sum(1), 1e-6)
            V = V - (d / gg)[:, None] * g
        return V

    # 鄰接矩陣，做幾次「拉平三角形→再投影回表面」
    n = len(V)
    I = np.concatenate([F[:, 0], F[:, 1], F[:, 2], F[:, 1], F[:, 2], F[:, 0]])
    Jx = np.concatenate([F[:, 1], F[:, 2], F[:, 0], F[:, 0], F[:, 1], F[:, 2]])
    A = sp.csr_matrix((np.ones(len(I)), (I, Jx)), shape=(n, n))
    A.data[:] = 1.0
    deg = np.asarray(A.sum(1)).ravel()
    V = project(V)
    for _ in range(relax):
        L = (A @ V) / deg[:, None]
        V = V + 0.6 * (L - V)
        V = project(V, 2)
    N = sdf.grad(V)
    N /= np.linalg.norm(N, axis=1, keepdims=True) + 1e-9
    return V, F, N


# ---------------------------------------------------------------- 紋路（每個頂點到最近紋路的距離）
# 掌紋：手掌座標 (x,y) 折線（感情線、智慧線、生命線）
PALM_LINES = [
    [(3.7, 6.35), (2.4, 6.75), (1.0, 7.05), (-0.4, 7.45), (-1.45, 8.05)],      # 感情線
    [(-3.35, 5.85), (-2.0, 5.35), (-0.4, 4.95), (1.2, 4.6), (2.4, 4.15)],      # 智慧線
    [(-3.3, 5.75), (-2.45, 4.6), (-1.95, 3.3), (-1.75, 2.0), (-1.75, 1.0)],   # 生命線
]


def _polyline_dist(P2, pts):
    pts = np.asarray(pts, float)
    best = np.full(len(P2), 1e9); tb = np.zeros(len(P2))
    seglen = np.linalg.norm(np.diff(pts, axis=0), axis=1)
    cum = np.concatenate([[0], np.cumsum(seglen)])
    for i in range(len(pts) - 1):
        a, b = pts[i], pts[i + 1]
        ab = b - a
        t = np.clip(((P2 - a) @ ab) / (ab @ ab), 0, 1)
        d = np.linalg.norm(P2 - (a + t[:, None] * ab), axis=1)
        m = d < best
        best[m] = d[m]; tb[m] = (cum[i] + t[m] * seglen[i]) / cum[-1]
    return best, tb


def _taper(t, a=0.15):
    """線兩端變細：回傳加在距離上的量"""
    e = np.minimum(t, 1 - t)
    return np.clip(1 - e / a, 0, 1) ** 2 * 0.06


def line_attributes(sdf, V, N):
    """回傳 ld（紋路距離）、cs（各部位接觸線有號值 dict）、nail（指甲符號距離）"""
    C = np.vstack([sdf.components(V[s:s + 200000]) for s in range(0, len(V), 200000)])
    owner = np.argmin(C, axis=1)
    K = sdf.K
    ld = np.full(len(V), 9.0)
    nail = np.full(len(V), 9.0)

    def joint_crease(ch, j, comp, offsets, half_angle, dorsal=False, curve=0.0, radial_tol=0.55,
                     extra_owner=None):
        """在第 j 個關節（0=MCP,1=PIP,2=DIP）畫橫紋。offsets：沿軸向的多條線位置(cm)。"""
        nonlocal ld
        J = ch['J'][j]
        if j == 0:
            Rm = ch['R'][0]
            n_ax = Rm[:, 1]
        else:
            Rm = ch['R'][j - 1] @ rx(-D(ch['flex'][j]) / 2)   # 半彎的座標系
            n_ax = nrm(ch['R'][j - 1][:, 1] + ch['R'][j][:, 1])
        q = (V - J) @ Rm
        theta = np.arctan2(q[:, 0], -q[:, 2])          # 0＝掌側正中
        if dorsal:
            theta = np.arctan2(q[:, 0], q[:, 2])        # 0＝背側正中
        rad = np.sqrt(q[:, 0] ** 2 + q[:, 2] ** 2)
        ok = (owner == comp)
        if extra_owner is not None:
            ok |= (owner == extra_owner)
        ok &= np.abs(rad - ch['r'][j]) < radial_tol
        s = (V - J) @ n_ax
        for off, ha in offsets:
            ha = D(ha if ha else half_angle)
            u = np.abs(theta) / ha
            dist = np.abs(s - off - curve * theta ** 2) + np.clip((u - 0.65) / 0.35, 0, 1) ** 2 * 0.07
            dist[(u > 1) | ~ok] = 9.0
            ld = np.minimum(ld, dist)

    for ci, n in enumerate(FINGER_NAMES):
        ch = K[n]
        comp = ci + 1
        # 掌側：指根橫紋、PIP 雙橫紋、DIP 單橫紋
        joint_crease(ch, 0, comp, [(1.05, 62)], 62, extra_owner=0)
        joint_crease(ch, 1, comp, [(-0.10, 64), (0.10, 60)], 64)
        joint_crease(ch, 2, comp, [(0.0, 60)], 60)
        # 手背：PIP 指節皺紋（三條短弧）、DIP 一條短弧
        joint_crease(ch, 1, comp, [(-0.20, 26), (0.0, 34), (0.20, 26)], 34, dorsal=True, curve=-0.12)
        joint_crease(ch, 2, comp, [(0.0, 24)], 24, dorsal=True, curve=-0.10)
        if SHOW_NAILS:
            nail = np.minimum(nail, _nail_sd(V, ch, owner == comp))
    th = K['thumb']
    joint_crease(th, 1, 5, [(0.25, 55)], 55, extra_owner=0)
    joint_crease(th, 2, 5, [(-0.08, 60), (0.12, 55)], 60)
    joint_crease(th, 2, 5, [(-0.18, 26), (0.02, 32), (0.22, 24)], 32, dorsal=True, curve=-0.12)
    if SHOW_NAILS:
        nail = np.minimum(nail, _nail_sd(V, th, owner == 5))

    # 掌紋：只在手掌、朝掌側（法線 -Z）的面
    palmside = (owner == 0) & (N[:, 2] < -0.45) & (V[:, 2] < 0)
    for pl in PALM_LINES:
        d2, t = _polyline_dist(V[:, :2], pl)
        dist = d2 - 0.012 + _taper(t)          # 掌紋比指節紋略粗
        dist[~palmside] = 9.0
        ld = np.minimum(ld, dist)

    # 接觸線（指縫線）：每個部位 j 存一個有號值 s_j = C_j - min(其他部位)。
    # 兩塊肉硬貼在一起的折痕上 s_j 剛好過零；線性內插有號值能精準找到折痕，
    # 著色器畫 |s_j| 很小的地方。指根等平滑融合處（表面不在任何部位上）遮掉不畫。
    minC = C.min(axis=1)
    hard = minC < 0.012
    # 指根「虎口／指蹼」附近不畫（那裡是皮膜漸變處，畫了會變成斷斷續續的短線）
    order = np.argsort(C, axis=1)
    a_id, b_id = order[:, 0], order[:, 1]
    within = np.ones((len(V), 6), bool)                      # palm 視為處處「在根部」
    for ci, n in enumerate(FINGER_NAMES):
        within[:, ci + 1] = np.linalg.norm(V - K[n]['J'][0], axis=1) < 2.5
    within[:, 5] = np.linalg.norm(V - K['thumb']['J'][1], axis=1) < 2.2
    rows = np.arange(len(V))
    hard &= ~(within[rows, a_id] & within[rows, b_id])
    cs = {}
    for j in range(C.shape[1]):
        others = np.delete(C, j, axis=1).min(axis=1)
        sj = (C[:, j] - others).astype(np.float64)
        sj[~hard] = 9.0
        cs[f'c{j}'] = sj
    return ld, cs, nail


def _nail_sd(V, ch, ok):
    J2, T = ch['J'][2], ch['J'][3]
    R = ch['R'][2]
    L = ch['L'][2]
    r = ch['r'][3]
    q = (V - J2) @ R
    phi = np.arctan2(q[:, 0], q[:, 2])          # 0＝指背
    u = phi * r                                  # 沿圓周的弧長
    s = q[:, 1]
    s0, s1 = 0.15 * L, L + 0.50 * r
    hw = 0.62 * r
    cs = (s0 + s1) / 2; hs = (s1 - s0) / 2
    rc = 0.45 * hw
    dx = np.abs(s - cs) - (hs - rc)
    dy = np.abs(u) - (hw - rc)
    out = np.sqrt(np.maximum(dx, 0) ** 2 + np.maximum(dy, 0) ** 2) + np.minimum(np.maximum(dx, dy), 0) - rc
    out[(~ok) | (np.abs(phi) > 1.4) | (q[:, 2] < 0)] = 9.0
    return out


# ---------------------------------------------------------------- 顏色
def hex2lin(h):
    h = h.lstrip('#')
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c)


def palette(skin_hex=None):
    """由一個膚色推出：暗面、紋路、外框、指甲顏色（線性色）。"""
    import colorsys
    h = (skin_hex or SKIN_HEX).lstrip('#')
    r, g, b = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    H, S, Vv = colorsys.rgb_to_hsv(r, g, b)

    def hx(hh, ss, vv):
        rr, gg, bb = colorsys.hsv_to_rgb(hh % 1, min(ss, 1), min(vv, 1))
        return '#%02x%02x%02x' % (round(rr * 255), round(gg * 255), round(bb * 255))
    return dict(
        lit=hex2lin(skin_hex or SKIN_HEX),
        shadow=hex2lin(hx(H - 0.012, S * 1.18, Vv * 0.84)),
        deep=hex2lin(hx(H - 0.02, S * 1.3, Vv * 0.70)),
        crease=hex2lin(hx(H - 0.025, S * 1.45, Vv * 0.58)),
        outline=hex2lin(hx(H - 0.03, S * 1.5, Vv * 0.36)),
        nail=hex2lin(hx(H + 0.005, S * 0.55, Vv * 1.06)),
    )


# ---------------------------------------------------------------- Blender
VIEWS = {
    # 名稱: (相機在「看向手」時的方向向量（從物體指向相機）, 相機上方向)
    'side':  ((1, 0, 0), (0, 0, 1)),     # 從小指側看：手指朝右、手背朝上
    'top':   ((0, 0, 1), (-1, 0, 0)),    # 從手背上方看：手指朝右、拇指在上
    'palm':  ((0, 0, -1), (1, 0, 0)),    # 從掌心看：手指朝右
    'three': ((0.75, 0.35, 1.0), (0, 0, 1)),  # 斜 45°：小指側上方、略偏指尖側（看得到拳頭正面）
}
ORTHO_CM = 30.0     # 畫面寬＝30 cm（所有姿勢、所有視角同一比例尺，方便對位）


def clear_scene():
    import bpy
    bpy.ops.wm.read_factory_settings(use_empty=True)


def to_blender(V, F, N, attrs, name='hand'):
    import bpy
    me = bpy.data.meshes.new(name)
    me.vertices.add(len(V))
    me.vertices.foreach_set('co', V.astype(np.float32).ravel())
    me.loops.add(F.size)
    me.loops.foreach_set('vertex_index', F.astype(np.int32).ravel())
    me.polygons.add(len(F))
    me.polygons.foreach_set('loop_start', (np.arange(len(F)) * 3).astype(np.int32))
    me.update()
    me.shade_smooth()
    me.normals_split_custom_set_from_vertices(N.astype(np.float32))
    for k, v in attrs.items():
        a = me.attributes.new(k, 'FLOAT', 'POINT')
        a.data.foreach_set('value', v.astype(np.float32))
    ob = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(ob)
    return ob


def make_material(skin_hex=None, line_w=0.045, contact_w=0.05):
    """平塗材質：Emission 輸出（不受燈光雜訊影響），亮暗兩階＋AO＋紋路。"""
    import bpy
    pal = palette(skin_hex)
    mat = bpy.data.materials.new('toon_skin')
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    N_ = nt.nodes.new
    L = nt.links.new
    out = N_('ShaderNodeOutputMaterial')
    geo = N_('ShaderNodeNewGeometry')
    light = N_('ShaderNodeCombineXYZ'); light.name = 'LIGHT'
    dot = N_('ShaderNodeVectorMath'); dot.operation = 'DOT_PRODUCT'
    L(geo.outputs['Normal'], dot.inputs[0]); L(light.outputs[0], dot.inputs[1])

    def mrange(src, a, b):
        m = N_('ShaderNodeMapRange'); m.interpolation_type = 'SMOOTHSTEP'; m.clamp = True
        m.inputs['From Min'].default_value = a; m.inputs['From Max'].default_value = b
        L(src, m.inputs['Value'])
        return m.outputs['Result']

    def mixc(fac, c1, c2):
        m = N_('ShaderNodeMix'); m.data_type = 'RGBA'; m.clamp_factor = True
        L(fac, m.inputs[0])
        for idx, c in ((6, c1), (7, c2)):
            if isinstance(c, tuple):
                m.inputs[idx].default_value = (*c, 1)
            else:
                L(c, m.inputs[idx])
        return m.outputs[2]

    def maxf(a, b):
        m = N_('ShaderNodeMath'); m.operation = 'MAXIMUM'
        L(a, m.inputs[0]); L(b, m.inputs[1]); return m.outputs[0]

    def attr(name):
        a = N_('ShaderNodeAttribute'); a.attribute_name = name; return a.outputs['Fac']

    lit = mrange(dot.outputs['Value'], 0.10, 0.18)        # 0=暗面, 1=亮面
    col = mixc(lit, pal['shadow'], pal['lit'])
    # （不用 AO：AO 在低取樣下有雜訊，會讓平塗的明暗交界變毛。）
    if SHOW_NAILS:
        nf = mrange(attr('nail'), 0.01, -0.01)
        col = mixc(nf, col, pal['nail'])
        nl = mrange(_abs(nt, attr('nail')), line_w * 0.75, line_w * 0.5)
    ln = mrange(attr('ld'), line_w, line_w * 0.7)
    lines = ln
    for j in range(6):                      # 指縫／接觸線
        cl = mrange(_abs(nt, attr(f'c{j}')), contact_w, contact_w * 0.6)
        lines = maxf(lines, cl)
    if SHOW_NAILS:
        lines = maxf(lines, nl)
    col = mixc(lines, col, pal['crease'])
    em = N_('ShaderNodeEmission'); em.inputs['Strength'].default_value = 1.0
    L(col, em.inputs['Color'])
    L(em.outputs[0], out.inputs['Surface'])
    return mat


def _abs(nt, src):
    m = nt.nodes.new('ShaderNodeMath'); m.operation = 'ABSOLUTE'
    nt.links.new(src, m.inputs[0]); return m.outputs[0]


def setup_scene(size=800, samples=24, outline_px=None):
    import bpy
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'
    sc.cycles.device = 'CPU'
    sc.cycles.samples = samples
    sc.cycles.use_denoising = False
    sc.cycles.max_bounces = 0
    sc.render.resolution_x = sc.render.resolution_y = size
    sc.render.film_transparent = True
    sc.render.image_settings.file_format = 'PNG'
    sc.render.image_settings.color_mode = 'RGBA'
    sc.view_settings.view_transform = 'Standard'
    w = bpy.data.worlds.new('w'); sc.world = w
    w.use_nodes = True
    w.node_tree.nodes['Background'].inputs['Strength'].default_value = 0.0
    sc.render.use_freestyle = True
    sc.render.line_thickness_mode = 'ABSOLUTE'
    vl = bpy.context.view_layer
    vl.use_freestyle = True
    fs = vl.freestyle_settings
    fs.crease_angle = D(120)
    ls = fs.linesets.new('outline')
    ls.select_silhouette = True
    ls.select_border = True
    ls.select_crease = False
    ls.select_contour = True
    lst = ls.linestyle
    lst.color = palette()['outline']
    lst.thickness = outline_px or max(2.0, 3.6 * size / 800)
    lst.caps = 'ROUND'
    cam = bpy.data.cameras.new('cam'); cam.type = 'ORTHO'; cam.ortho_scale = ORTHO_CM
    co = bpy.data.objects.new('cam', cam)
    sc.collection.objects.link(co)
    sc.camera = co
    return sc


def set_outline_color(hex_):
    import bpy
    ls = bpy.context.view_layer.freestyle_settings.linesets[0]
    ls.linestyle.color = palette(hex_)['outline']


def place_camera(view, target):
    """相機看向 target（世界座標）。回傳相機物件。"""
    import bpy
    from mathutils import Vector, Matrix
    sc = bpy.context.scene
    co = sc.camera
    d, up = VIEWS[view]
    d = nrm(d); up = np.asarray(up, float)
    zc = d                                  # 相機 +Z（指向觀察者）
    xc = nrm(np.cross(up, zc))
    yc = np.cross(zc, xc)
    M = np.eye(4)
    M[:3, 0], M[:3, 1], M[:3, 2] = xc, yc, zc
    M[:3, 3] = np.asarray(target) + zc * 60
    co.matrix_world = Matrix(M.tolist())
    co.data.clip_end = 200
    return co, xc, yc, zc


def set_light(mat, xc, yc, zc):
    """光從畫面左上前方來（相對相機固定，所以各視角明暗一致）。"""
    Lc = nrm([-0.45, 0.70, 0.55])
    Lw = Lc[0] * xc + Lc[1] * yc + Lc[2] * zc
    n = mat.node_tree.nodes['LIGHT']
    for i in range(3):
        n.inputs[i].default_value = float(Lw[i])


def project_px(co_world, cam_axes, target, size):
    """世界座標（cm）→ 圖片像素 (x 右, y 下)。正交投影。"""
    xc, yc, zc = cam_axes
    v = np.asarray(co_world) - np.asarray(target)
    s = size / ORTHO_CM
    return [float(size / 2 + (v @ xc) * s), float(size / 2 - (v @ yc) * s)]


def build(pose, h=0.11):
    """姿勢 → (Blender 物件, HandSDF)。"""
    sdf = HandSDF(pose)
    V, F, N = make_mesh(sdf, h=h)
    ld, cs, nail = line_attributes(sdf, V, N)
    ob = to_blender(V, F, N, dict(ld=ld, nail=nail, **cs))
    return ob, sdf
