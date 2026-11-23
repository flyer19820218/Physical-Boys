#!/usr/bin/env python3
"""build_circuit_centerlines.py
把各器官場景（小腸／肝／腎／肺／腦）已經有的中心線，合成「完整封閉路線」總覽場景用的一份 circuit_centerlines_v1.json。
不重算任何解剖資料：主幹（半徑取自資料集網格）原樣照抄，座標系和 si_scene_v1.glb 一致（公尺，+Y 向上、+Z 向前、+X 人體左側）。
各器官裡的小血管床改成「示意」：
  - 小腸：art_/cap_/ven_（沿用小腸場景）；肝：liver_cap_*（沿用小腸場景的肝竇示意管）
  - 腎：kart_（入球小動脈）→ 示意微血管 kc_ → kven_（腎內小靜脈）；腎絲球的線圈太小，不照抄
  - 腦：lcar／rcar 末端 → 示意微血管 bc_F／bc_B1 → Fpv／B1pv（腦靜脈）→ rdrain（上矢狀竇→頸靜脈→上腔靜脈）；腦皮質的微血管床太小，不照抄
  - 肺：a_（葉動脈）→ s_（到肺泡床的小動脈）→ 示意微血管 lc_ → v_（小靜脈）→ pv_（肺靜脈）；肺泡微血管網太小，不照抄
所有小口徑都放大（總覽鏡頭離人體約 1 公尺，真實口徑畫不出來）：r' = r + 0.6·max(0, 1.6 mm − r)，單調、連續，所以接點粗細不會跳。
用法：python3 tools/anatomy/build_circuit_centerlines.py   （在 repo 根目錄；輸出 assets/biology/anatomy3d/circuit_centerlines_v1.json）
"""
import json, math, os, re, sys

D = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'assets', 'biology', 'anatomy3d')
load = lambda n: json.load(open(os.path.join(D, n)))
SI, KID, LUNG, BRAIN = load('si_centerlines_v1.json'), load('kidney_centerlines_v1.json'), load('lung_centerlines_v1.json'), load('brain_centerlines_v1.json')

RCUT, RGAIN = 0.0016, 0.6
def enlarge(r): return r + RGAIN * max(0.0, RCUT - r)

OUT, SRC = {}, {}
def take(src, name, key=None, tag=None):
    s = src['segments'][name]
    t = {k: v for k, v in s.items() if k not in ('points', 'radius')}
    t['points'] = [[round(c, 5) for c in p] for p in s['points']]
    t['radius'] = [round(enlarge(r), 6) for r in s['radius']]
    t['from'] = tag
    OUT[key or name] = t

def seg(src, pattern):
    rx = re.compile(pattern)
    return [k for k in src['segments'] if rx.fullmatch(k)]

# ---- 小腸場景：心臟出口、主動脈、腸系膜上動脈、肝動脈、門靜脈系統、肝靜脈、下腔靜脈、肝竇示意管、小腸微血管床
for n in SI['segments']:
    take(SI, n, tag='si')
# ---- 腎：腎動脈、腎靜脈、入球小動脈、腎內小靜脈（IVC、主動脈用小腸場景的）
for n in ['renal_a_L', 'renal_ant_L', 'renal_post_L', 'renal_a_R', 'renal_ant_R', 'renal_post_R', 'renal_v_L', 'renal_v_R']:
    take(KID, n, tag='kidney')
KBEDS = sorted({re.match(r'kart_(\w+)$', k).group(1) for k in KID['segments'] if k.startswith('kart_')})
for b in KBEDS:
    take(KID, 'kart_' + b, tag='kidney'); take(KID, 'kven_' + b, tag='kidney')
# ---- 腦：頸動脈（左頸總→…→床 F 的軟腦膜小動脈；右頭臂動脈幹→…→床 B1）、腦靜脈（床 F、B1 的腦靜脈）、靜脈回流、右心房
for n in ['lcar', 'rcar', 'Fpv', 'B1pv', 'rdrain', 'ra_in', 'ra_rv']:
    take(BRAIN, n, tag='brain')
# ---- 肺：右心室出口、肺動脈、葉動脈、小動脈、小靜脈、肺靜脈、左心房→左心室
for n in ['rv_out', 'pa_trunk', 'pa_L', 'pa_R', 'pv_LS', 'pv_LI', 'pv_RS', 'pv_RI', 'la_lv']:
    take(LUNG, n, tag='lung')
LBEDS = LUNG['named']['beds']
for n in ['a_LU', 'a_LL', 'a_RU', 'a_RM', 'a_RL']:
    take(LUNG, n, tag='lung')
for b in LBEDS:
    take(LUNG, 's_' + b, tag='lung'); take(LUNG, 'v_' + b, tag='lung')

# ---- 心腔內接點：腦場景的 ra_rv（右心房→右心室）終點和肺場景的 rv_out（右心室→肺動脈幹）起點差約 7.5 mm，
#      追蹤的紅血球在第 4→5 步交界會跳一下；把 ra_rv 末端補一點接到 rv_out 起點（都在右心室腔內，不影響血管外形）
OUT['ra_rv']['points'].append(list(OUT['rv_out']['points'][0])); OUT['ra_rv']['radius'].append(OUT['ra_rv']['radius'][-1])

# ---- 示意微血管（把一條小動脈的終點接到一條小靜脈的起點）：幾條帶側向偏移與一點深度的弧，像一小團微血管床
def _unit(v):
    n = math.sqrt(sum(x * x for x in v)) or 1e-9
    return [x / n for x in v]

def _tan_at(pts, r, end):
    """端點處的行進方向（朝血流前進）：取離端點約 2 倍半徑以外的點，至少隔一個點"""
    P = pts if end == 'end' else pts[::-1]
    last = P[-1]; acc = 0.0; j = len(P) - 2
    while j > 0 and acc < max(2.0 * r, 0.002):
        acc = math.dist(P[j], last); j -= 1
    v = [last[c] - P[j][c] for c in range(3)]
    v = _unit(v)
    return v if end == 'end' else [-x for x in v]

def _bez(P0, P1, P2, P3, n):
    out = []
    for i in range(n):
        u = i / (n - 1); a = (1 - u) ** 3; b = 3 * u * (1 - u) ** 2; c = 3 * u * u * (1 - u); d = u ** 3
        out.append([a * P0[k] + b * P1[k] + c * P2[k] + d * P3[k] for k in range(3)])
    return out

def _minratio(P, r):
    """最小曲率半徑 ÷ 管半徑（取離 0.7 r 的前後點算外接圓，和審查腳本同一算法）"""
    s = [0.0]
    for i in range(1, len(P)): s.append(s[-1] + math.dist(P[i], P[i - 1]))
    m = 1e9
    for i in range(1, len(P) - 1):
        a = i; b = i
        while a > 0 and s[i] - s[a] < 0.7 * r: a -= 1
        while b < len(P) - 1 and s[b] - s[i] < 0.7 * r: b += 1
        if a == i or b == i: continue
        A_, B_, C_ = P[a], P[i], P[b]
        ab, bc, ca = math.dist(A_, B_), math.dist(B_, C_), math.dist(C_, A_)
        u_ = [B_[k] - A_[k] for k in range(3)]; v_ = [C_[k] - A_[k] for k in range(3)]
        cr = math.sqrt(sum(x * x for x in [u_[1] * v_[2] - u_[2] * v_[1], u_[2] * v_[0] - u_[0] * v_[2], u_[0] * v_[1] - u_[1] * v_[0]]))
        if cr > 1e-14: m = min(m, ab * bc * ca / (2 * cr) / r)
    return m

def trim(name, end, length):
    """把一條管子從 end（'end'＝末端、'start'＝起端）端縮短 length（公尺，沿弧長），內插出新的端點。
    用途：微血管床的『小動脈末端↔小靜脈起端』弦太短（3～7 mm），兩端又是迎面的，連起來只能轉成急彎的小 U；各縮短幾 mm 讓弦拉長、床才畫得開。"""
    s = OUT[name]; P, R = s['points'], s['radius']
    if end == 'start': P, R = P[::-1], R[::-1]
    acc = 0.0; i = len(P) - 1
    while i > 1 and acc + math.dist(P[i], P[i - 1]) < length:
        acc += math.dist(P[i], P[i - 1]); i -= 1
    seglen = math.dist(P[i], P[i - 1]) or 1e-9; f = (length - acc) / seglen; f = min(max(f, 0.0), 1.0)
    newp = [round(P[i][c] + (P[i - 1][c] - P[i][c]) * f, 5) for c in range(3)]; newr = round(R[i] + (R[i - 1] - R[i]) * f, 6)
    P2, R2 = P[:i] + [newp], R[:i] + [newr]
    if end == 'start': P2, R2 = P2[::-1], R2[::-1]
    s['points'], s['radius'] = P2, R2

def bridge(a, b, n_lines, amp, depth_dir, o2, kind, r_mm, name, tag, seed=0):
    """把一條小動脈的終點接到一條小靜脈的起點：n 條三次 Bezier，起點／終點切線＝兩端血管的行進方向（切線相接，不是斜插進去），
    控制點沿切線拉長到曲率半徑 ≥ 3 倍管半徑（自動搜尋）；各條由控制點的側向位移散開，兩端重合、中段散成梭形；
    半徑：兩端＝微血管半徑，中段縮到 0.6 倍（梭形，不是一根粗圓柱）。接點的半徑連續與封口交給 polish_vessels。"""
    A, B = OUT[a]['points'][-1], OUT[b]['points'][0]
    # 微血管的半徑不是「跟小動脈一樣粗」：n 條子管的總截面積≈母管（Murray 定律 r_子 = r_母·n^(-1/3)），中段再縮窄成梭形。
    # 以前 n 條都用母管的粗細，疊在一起就成了一根粗香腸、和細管接起來還有落差。
    rA_, rB_ = OUT[a]['radius'][-1], OUT[b]['radius'][0]
    rl = math.sqrt(rA_ * rB_) * n_lines ** (-1.0 / 3.0)
    tA = _tan_at(OUT[a]['points'], OUT[a]['radius'][-1], 'end'); tB = _tan_at(OUT[b]['points'], OUT[b]['radius'][0], 'start')
    d = [B[i] - A[i] for i in range(3)]; L = math.sqrt(sum(x * x for x in d)) or 1e-6; tc = [x / L for x in d]
    up = [0, 1, 0] if abs(tc[1]) < 0.9 else [1, 0, 0]
    s = _unit([tc[1] * up[2] - tc[2] * up[1], tc[2] * up[0] - tc[0] * up[2], tc[0] * up[1] - tc[1] * up[0]])
    q = _unit([tc[1] * s[2] - tc[2] * s[1], tc[2] * s[0] - tc[0] * s[2], tc[0] * s[1] - tc[1] * s[0]])
    # 兩端血管的行進方向若背向對方（餘弦 ≤0），硬要沿切線出去會繞一個大 S 彎：這種情況改用弦方向（接點由圓頭封口包起來），
    # 餘弦為正時依比例混合，離對方越近越照血管自己的方向
    cA = sum(tA[i] * tc[i] for i in range(3)); cB = sum(tB[i] * tc[i] for i in range(3))
    wA, wB = max(0.0, cA) ** 0.5, max(0.0, cB) ** 0.5
    tA = _unit([wA * tA[i] + (1 - wA) * tc[i] for i in range(3)]); tB = _unit([wB * tB[i] + (1 - wB) * tc[i] for i in range(3)])
    gap = 2.2 * 0.6 * rl                    # 中段相鄰兩條的管心距 ≥ 1.1 倍管徑（中段半徑 0.7 rl）；amp 參數保留但不再決定寬度
    best = None
    for kf in (0.35, 0.5, 0.7, 1.0, 1.4, 1.9, 2.6, 3.4):
        k = max(kf * L, 2.5 * rl / n_lines ** (-1.0 / 3.0) * 0.8)
        worst = 1e9; lines = []
        for j in range(n_lines):
            o = (j - (n_lines - 1) / 2) * gap
            oq = (0.0 if j % 2 == 0 else 0.5) * gap * 0.8
            P1 = [A[c] + tA[c] * k + s[c] * o * 1.15 + q[c] * oq for c in range(3)]
            P2 = [B[c] - tB[c] * k + s[c] * o * 1.15 + q[c] * oq for c in range(3)]
            curve = _bez(A, P1, P2, B, 120)
            # 依弧長重新取點（約每 0.8 mm 一點）
            cum = [0.0]
            for i in range(1, len(curve)): cum.append(cum[-1] + math.dist(curve[i], curve[i - 1]))
            m = max(13, int(cum[-1] / 0.0008) + 1); pts = []
            for i in range(m):
                target = cum[-1] * i / (m - 1); lo = 0
                while lo < len(cum) - 2 and cum[lo + 1] < target: lo += 1
                f = (target - cum[lo]) / max(cum[lo + 1] - cum[lo], 1e-12)
                pts.append([curve[lo][c] * (1 - f) + curve[lo + 1][c] * f for c in range(3)])
            lines.append(pts); worst = min(worst, _minratio(pts, 0.6 * rl))
        if best is None or worst > best[0] + 0.1:
            best = (worst, kf, lines)
        if worst >= 3.0: break
    worst, kf, lines = best
    print('  bridge %-7s chord %.1f mm  k %.2f×  min curvature radius/r %.2f' % (name, L * 1000, kf, worst))
    for j, pts in enumerate(lines):
        m = len(pts); rad = [round(rl * (1 - 0.4 * math.sin(math.pi * i / (m - 1))), 6) for i in range(m)]
        OUT['%s_%d' % (name, j)] = {'kind': kind, 'o2': o2, 'source': 'generated: schematic capillary bed between %s and %s (enlarged)' % (a, b),
                                    'schematic': True, 'points': [[round(x, 5) for x in p] for p in pts], 'radius': rad, 'capStart': False, 'capEnd': False, 'from': tag}

TRIM_K, TRIM_L = 0.005, 0.004   # 腎、肺的微血管床：小動脈末端／小靜脈起端各縮短的長度（公尺）
# 床的寬度（線數×間距）放大到總覽鏡頭看得出是一小團（腦、腎在第 2 步約 1.7 m 遠、肺在第 5 步約 0.45 m 遠）
bridge('lcar', 'Fpv', 5, 0.005, [0, -1, 0], 'rich>poor', 'capillary', 0.45, 'bc_F', 'brain')
bridge('rcar', 'B1pv', 5, 0.005, [0, -1, 0], 'rich>poor', 'capillary', 0.45, 'bc_B1', 'brain')
for b in KBEDS:
    trim('kart_' + b, 'end', TRIM_K); trim('kven_' + b, 'start', TRIM_K)
    bridge('kart_' + b, 'kven_' + b, 3, 0.0035, [0, 0, 0], 'rich>poor', 'capillary', 0.35, 'kc_' + b, 'kidney')
for b in LBEDS:
    trim('s_' + b, 'end', TRIM_L); trim('v_' + b, 'start', TRIM_L)
    bridge('s_' + b, 'v_' + b, 5, 0.004, [0, 0, 0], 'poor>rich', 'capillary', 0.3, 'lc_' + b, 'lung')

# ---- 檢查：各鏈的接點間距（公尺）。一條鏈 = 前一段的終點應接近後一段的起點（追蹤用的路徑）
def gap(a, b):
    # 接續（a 的終點接 b 的某處）或分支（b 的起點在 a 的某處）取小的那個
    A, B = OUT[a]['points'][-1], OUT[b]['points'][0]
    best = min(min(math.dist(A, p) for p in OUT[b]['points']), min(math.dist(B, p) for p in OUT[a]['points']))
    return round(best * 1000, 1)
CHAINS = {
    'gut':    ['lv_out', 'aorta', 'sma', 'art_4', 'cap_4', 'ven_4', 'smv', 'portal', 'liver_cap_b', 'hv1', 'ivc_upper', 'ra_rv', 'rv_out', 'pa_trunk', 'pa_L', 'a_LL', 's_LL0', 'lc_LL0_2', 'v_LL0', 'pv_LI', 'la_lv', 'lv_out'],
    'kidney': ['aorta_lower', 'renal_a_L', 'renal_ant_L', 'kart_' + KBEDS[0], 'kc_%s_1' % KBEDS[0], 'kven_' + KBEDS[0], 'renal_v_L', 'ivc_lower'],
    'brain':  ['aorta', 'lcar', 'bc_F_2', 'Fpv', 'rdrain', 'ra_in'],
    'brainR': ['aorta', 'rcar', 'bc_B1_2', 'B1pv', 'rdrain'],
}
val = {}
for nm, ch in CHAINS.items():
    val[nm] = [[ch[i], ch[i + 1], gap(ch[i], ch[i + 1])] for i in range(len(ch) - 1)]
    bad = [x for x in val[nm] if x[2] > 4.0]
    print(nm, 'max gap %.1f mm' % max(x[2] for x in val[nm]), ('  >4mm: %s' % bad) if bad else '')

doc = {
    'version': 1, 'units': 'm', 'axes': '+X body left, +Y up, +Z anterior (same as si_scene_v1.glb)',
    'generator': 'tools/anatomy/build_circuit_centerlines.py',
    'note': '完整封閉路線總覽：各器官場景的主幹中心線原樣合併（半徑取自網格）；各器官的小血管床為示意（放大口徑，r\'=r+0.6·max(0,1.6mm−r)）。',
    'validation': {'chain_gaps_mm': val}, 'named': {'kbeds': KBEDS, 'lbeds': LBEDS},
    'segments': OUT
}
p = os.path.join(D, 'circuit_centerlines_v1.json')
json.dump(doc, open(p, 'w'), separators=(',', ':'))
print('segments', len(OUT), 'points', sum(len(s['points']) for s in OUT.values()), 'bytes', os.path.getsize(p))

# 血管接點整理（老師 2026-11-23：不要錐形殘端、半徑要連續漸變；規則見 tools/anatomy/polish_vessels.py 檔頭）
import os as _os, sys as _sys
_sys.path.insert(0, _os.path.dirname(_os.path.abspath(__file__)))
import polish_vessels as _pv
_pv.polish_path(p)
