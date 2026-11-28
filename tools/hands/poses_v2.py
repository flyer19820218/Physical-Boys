"""姿勢庫 v2。

每個姿勢 = 一組角度 + 擺放方向 + 錨點（接觸點、施力方向）。
  angles : index/middle/ring/pinky = (外展, MCP, PIP, DIP)；thumb = (abd, palm, roll, mcp, ip)
           （各角度意義見 build_hand_v2.py 開頭說明）
  orient : 整隻手在世界中的旋轉（度，依 X→Y→Z 順序的 Euler 角）。
           預設 (0,0,0) = 手指朝右(+Y)、手背朝上(+Z)，側視圖看到小指側。
  anchors: {名稱: 規格}，規格種類：
           ('surface', 起點(手座標), 方向(手座標))  → 從起點沿方向找到皮膚表面的點
           ('point', 手座標點)                       → 直接給點
           ('cyl', 中心, 軸向, 半徑)                 → 圓柱（握持物）
           'force' 欄 = 施力方向（世界座標，orient 之後；例如 (0,1,0)=往畫面右）

新增姿勢：在 POSES 加一筆即可（angles 可直接寫數字，或用下面的求解小工具）。
"""
import math
import numpy as np
import build_hand_v2 as B

Z = (0, 0, 0, 0)


def P(index=Z, middle=Z, ring=Z, pinky=Z, thumb=(45, 15, -40, 8, 8)):
    return dict(index=tuple(index), middle=tuple(middle), ring=tuple(ring), pinky=tuple(pinky),
                thumb=tuple(thumb))


# ---------------------------------------------------------------- 求解小工具
def solve_wrap(R, yc, zc, fingers=('index', 'middle', 'ring', 'pinky'), extra=0.0):
    """四指包住一根沿 X 軸的圓柱（半徑 R，中心 (·,yc,zc)），回傳各指 (0,mcp,pip,dip)。"""
    from scipy.optimize import minimize
    out = {}
    c = np.array([yc, zc])
    for n in fingers:
        g = B.FINGERS[n]

        def cost(x):
            ch = B.finger_chain(n, 0, *x)
            J, r = ch['J'], ch['r']
            e = 0.0
            for i in range(3):
                for t in np.linspace(0.25, 1.0, 5):
                    p = J[i] + t * (J[i + 1] - J[i])
                    rr = r[i] + t * (r[i + 1] - r[i])
                    d = np.linalg.norm(p[1:] - c) - (R + rr * 0.92 + extra)
                    e += d * d * (6.0 if d < 0 else 1.0)
            # 輕微偏好自然的彎曲比例，避免解出「某關節完全打直」的怪姿勢
            return e + 0.003 * np.sum((np.asarray(x) - [45, 60, 35]) ** 2)
        best = minimize(cost, [45, 60, 35], bounds=[(0, 100), (0, 110), (0, 90)], method='L-BFGS-B')
        out[n] = (0.0, *[round(float(v), 1) for v in best.x])
    return out


def solve_thumb_wrap(R, yc, zc, x0=(30, 55, -70, 20, 20)):
    """拇指從另一側貼住圓柱。"""
    from scipy.optimize import minimize
    c = np.array([yc, zc])

    def cost(x):
        ch = B.thumb_chain(*x)
        J, r = ch['J'], ch['r']
        e = 0.0
        for i in (1, 2):
            for t in np.linspace(0.0, 1.0, 5):
                p = J[i] + t * (J[i + 1] - J[i])
                rr = r[i] + t * (r[i + 1] - r[i])
                d = np.linalg.norm(p[1:] - c) - (R + rr * 0.92)
                e += d * d * (6.0 if d < 0 else 1.0)
        e += 0.0004 * np.sum((np.array(x) - np.array(x0)) ** 2)
        return e
    res = minimize(cost, x0, bounds=[(0, 80), (0, 90), (-100, 0), (0, 60), (0, 60)], method='L-BFGS-B')
    return tuple(round(float(v), 1) for v in res.x)


def pad_point(ch, inset=0.92):
    """指腹（遠節掌側）表面附近的點與朝外方向。"""
    J, R, r = ch['J'], ch['R'], ch['r']
    n = -R[2][:, 2]
    return J[3] - 0.25 * R[2][:, 1] + n * r[3] * inset, n


def solve_pinch(index, gap=0.7, x0=(25, 45, -75, 20, 20)):
    """拇指指腹去碰食指指腹（中間夾一個 gap 公分的小東西）。"""
    from scipy.optimize import minimize
    ich = B.finger_chain('index', *index)
    ip, inn = pad_point(ich)

    def cost(x):
        tp, tn = pad_point(B.thumb_chain(*x))
        target = ip + inn * gap
        e = np.sum((tp - target) ** 2) + 0.6 * (1 + tn @ inn) ** 2
        e += 0.0002 * np.sum((np.array(x) - np.array(x0)) ** 2)
        return e
    res = minimize(cost, x0, bounds=[(0, 80), (0, 90), (-110, 0), (0, 70), (0, 70)], method='L-BFGS-B')
    th = tuple(round(float(v), 1) for v in res.x)
    tp, _ = pad_point(B.thumb_chain(*th))
    return th, (ip + tp) / 2


def solve_thumb_over(fingers, w_across=2.0):
    """握拳類：拇指指腹壓在食指、中指的中節外側（橫過拳頭前下方）。fingers＝四指角度 dict。"""
    from scipy.optimize import minimize
    ic = B.finger_chain('index', *fingers['index'])
    mc = B.finger_chain('middle', *fingers['middle'])
    mi = (ic['J'][1] + ic['J'][2]) / 2
    mm = (mc['J'][1] + mc['J'][2]) / 2
    dors = B.nrm(ic['R'][1][:, 2] + mc['R'][1][:, 2])
    tgt = 0.35 * mi + 0.65 * mm + dors * 1.1 + np.array([0, 1.0, 0])   # 拇指略壓進手指（硬聯集，看起來是貼著）

    def cost(x):
        ch = B.thumb_chain(*x)
        tp, tn = pad_point(ch)
        e = np.sum((tp - tgt) ** 2) + (1 + tn @ dors) ** 2
        e += w_across * (1 - B.nrm(ch['J'][3] - ch['J'][2]) @ np.array([1.0, 0, 0])) ** 2
        return e
    best = None
    for s in ([20, 60, -80, 30, 30], [40, 40, -60, 40, 40], [10, 80, -100, 20, 50], [50, 70, -130, 60, 60]):
        r = minimize(cost, s, bounds=[(0, 90), (0, 110), (-160, 0), (0, 95), (0, 95)], method='L-BFGS-B')
        if best is None or r.fun < best.fun:
            best = r
    return tuple(round(float(v), 1) for v in best.x)


# ---------------------------------------------------------------- 姿勢
FIST = dict(index=(-1, 88, 98, 52), middle=(0, 92, 100, 52), ring=(1, 94, 100, 52), pinky=(2, 96, 98, 50))
FIST_THUMB = solve_thumb_over(FIST)

# 握圓柱（直徑 6 cm）：用求解器算四指與拇指角度
GRIP_R, GRIP_Y, GRIP_Z = 3.0, 7.0, -4.9
_wrap = solve_wrap(GRIP_R, GRIP_Y, GRIP_Z)
_grip_thumb = solve_thumb_wrap(GRIP_R, GRIP_Y, GRIP_Z)

# 捏：食指半彎，拇指求解去碰它
PINCH_INDEX = (2, 38, 40, 22)
_pinch_thumb, _pinch_pt = solve_pinch(PINCH_INDEX)

PALM_DOWN = ('surface', (0.0, 5.0, 0.0), (0, 0, -1))      # 掌心中心（掌側表面）
TIP = lambda n: ('tip', n)                                 # 指尖最前端
PAD = lambda n: ('pad', n)                                 # 指腹

POSES = {
    'open': dict(
        angles=P(index=(8, 5, 6, 4), middle=(1, 5, 6, 4), ring=(7, 5, 6, 4), pinky=(14, 5, 6, 4),
                 thumb=(48, 10, -40, 8, 8)),
        anchors={'palm_center': dict(spec=PALM_DOWN, force=None)}),
    'fist': dict(
        angles=P(**FIST, thumb=FIST_THUMB),
        anchors={'knuckles': dict(spec=('surface', (-0.9, 9.0, 0.0), (0, 1, 0.3)), force=(0, 1, 0))}),
    'point': dict(
        angles=P(index=(0, 0, 4, 2), middle=FIST['middle'], ring=FIST['ring'], pinky=FIST['pinky'],
                 thumb=FIST_THUMB),
        anchors={'index_tip': dict(spec=TIP('index'), force=(0, 1, 0))}),
    'grip': dict(
        angles=P(**_wrap, thumb=_grip_thumb),
        orient=(0, 90, 0),
        anchors={'cylinder': dict(spec=('cyl', (0, GRIP_Y, GRIP_Z), (1, 0, 0), GRIP_R), force=None)}),
    'pinch': dict(
        angles=P(index=PINCH_INDEX, middle=(0, 50, 62, 34), ring=(0, 58, 70, 40), pinky=(0, 64, 74, 44),
                 thumb=_pinch_thumb),
        orient=(0, 90, 0),
        anchors={'pinch_point': dict(spec=('point', tuple(_pinch_pt)), force=None)}),
    'push': dict(
        angles=P(index=(1, -4, 2, 2), middle=(0, -4, 2, 2), ring=(1, -4, 2, 2), pinky=(3, -4, 2, 2),
                 thumb=(20, 0, -30, 5, 5)),
        orient=(90, 0, 0),
        anchors={'palm_center': dict(spec=PALM_DOWN, force=(0, 1, 0))}),
    'push_fingertip': dict(
        angles=P(index=(0, 8, 8, 4), middle=FIST['middle'], ring=FIST['ring'], pinky=FIST['pinky'],
                 thumb=FIST_THUMB),
        orient=(0, 0, 0),
        anchors={'index_tip': dict(spec=TIP('index'), force=(0, 1, 0))}),
    'hook': dict(
        angles=P(index=(0, 8, 88, 38), middle=(0, 8, 90, 38), ring=(0, 10, 90, 36), pinky=(0, 14, 88, 34),
                 thumb=(40, 15, -45, 10, 10)),
        anchors={'hook_point': dict(spec=('hook', 'middle'), force=(0, -1, 0))}),
    'hold_flat': dict(
        angles=P(index=(2, 4, 10, 6), middle=(0, 4, 10, 6), ring=(2, 4, 10, 6), pinky=(4, 6, 12, 8),
                 thumb=(30, 8, -40, 6, 6)),
        orient=(0, 180, 0),
        anchors={'palm_center': dict(spec=PALM_DOWN, force=(0, 0, 1))}),
    'press_down': dict(
        angles=P(index=(2, -6, 2, 2), middle=(0, -6, 2, 2), ring=(2, -6, 2, 2), pinky=(4, -6, 2, 2),
                 thumb=(26, 8, -40, 4, 4)),
        anchors={'palm_center': dict(spec=PALM_DOWN, force=(0, 0, -1))}),
}

for _v in POSES.values():
    _v.setdefault('orient', (0, 0, 0))
