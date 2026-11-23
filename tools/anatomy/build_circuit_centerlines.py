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
def bridge(a, b, n_lines, amp, depth_dir, o2, kind, r_mm, name, tag, seed=0):
    A, B = OUT[a]['points'][-1], OUT[b]['points'][0]
    d = [B[i] - A[i] for i in range(3)]; L = math.sqrt(sum(x * x for x in d)) or 1e-6
    t = [x / L for x in d]
    up = [0, 1, 0] if abs(t[1]) < 0.9 else [1, 0, 0]
    s = [t[1] * up[2] - t[2] * up[1], t[2] * up[0] - t[0] * up[2], t[0] * up[1] - t[1] * up[0]]
    sl = math.sqrt(sum(x * x for x in s)) or 1; s = [x / sl for x in s]
    for k in range(n_lines):
        off = (k - (n_lines - 1) / 2) * amp
        pts = []
        for i in range(13):
            u = i / 12; w = math.sin(math.pi * u)
            pts.append([round(A[c] + d[c] * u + s[c] * off * w + depth_dir[c] * amp * 0.9 * w * (1 if k % 2 == 0 else 0.5), 5) for c in range(3)])
        OUT['%s_%d' % (name, k)] = {'kind': kind, 'o2': o2, 'source': 'generated: schematic capillary bed between %s and %s (enlarged)' % (a, b),
                                    'schematic': True, 'points': pts, 'radius': [round(enlarge(r_mm / 1000.0), 6)] * len(pts), 'capStart': False, 'capEnd': False, 'from': tag}

# 床的寬度（線數×間距）放大到總覽鏡頭看得出是一小團（腦、腎在第 2 步約 1.7 m 遠、肺在第 5 步約 0.45 m 遠）
bridge('lcar', 'Fpv', 5, 0.005, [0, -1, 0], 'rich>poor', 'capillary', 0.45, 'bc_F', 'brain')
bridge('rcar', 'B1pv', 5, 0.005, [0, -1, 0], 'rich>poor', 'capillary', 0.45, 'bc_B1', 'brain')
for b in KBEDS:
    bridge('kart_' + b, 'kven_' + b, 3, 0.0035, [0, 0, 0], 'rich>poor', 'capillary', 0.35, 'kc_' + b, 'kidney')
for b in LBEDS:
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
