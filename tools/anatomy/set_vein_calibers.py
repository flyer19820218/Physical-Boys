#!/usr/bin/env python3
"""把「門脈—肝—下腔靜脈」這條回流路線的靜脈口徑，改成依文獻的值（逐段由細到粗）。

為什麼要有這支：build_si_centerlines.py 從資料集網格估出的半徑，肝門靜脈／腸繫膜上靜脈／脾靜脈比文獻細很多
（肝門靜脈 5.4 mm，文獻約 7–13 mm），肝靜脈又被手填成 6.6 mm，網格外殼卻是 23 mm 寬的短粗管，
畫面上就變成「外面套一層膜、粗細忽粗忽細」。現在這幾條靜脈不再畫資料集的網格外殼，而是由核心引擎依中心線與
這裡設定的半徑畫成**單一層**的管（管壁＝血流範圍），所以這裡的數字就是畫面上看到的血管粗細。

用法（在 repo 根目錄）：
    python3 tools/anatomy/build_si_centerlines.py    # 先重建中心線（若需要；原始資料集不在沙盒時可略過）
    python3 tools/anatomy/set_vein_calibers.py       # 再套用口徑（可重複執行，結果相同）

半徑單位：公尺（寫進 JSON 前，下面表格以 mm 為單位）。數字與出處見 assets/biology/anatomy3d/sources.md「血管口徑」一節。
"""
import json, math, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
PATH = os.path.join(HERE, '..', '..', 'assets', 'biology', 'anatomy3d', 'si_centerlines_v1.json')
MM = 0.001


def smoothstep(x):
    x = min(1.0, max(0.0, x))
    return x * x * (3 - 2 * x)


def arc_fractions(pts):
    cum = [0.0]
    for i in range(1, len(pts)):
        cum.append(cum[-1] + math.dist(pts[i - 1], pts[i]))
    L = cum[-1] or 1e-9
    return [c / L for c in cum]


def lerp(a, b, t):
    return a + (b - a) * t


# ---- 半徑（mm）設定：每一段給「起點→終點」或自訂函式 ----
# 門靜脈系統：愈接近肝愈粗（小靜脈 → 腸繫膜上靜脈 → 肝門靜脈）
SPEC = {
    # 腸繫膜上靜脈：直徑 7 → 9.5 mm（接近匯合處與肝門靜脈相當）
    'smv': lambda u, y: lerp(3.5, 4.75, smoothstep(u)),
    # 脾靜脈：直徑 6.5 → 8 mm（低於超音波正常上限約 10 mm）
    'splenic': lambda u, y: lerp(3.25, 4.0, smoothstep(u)),
    # 肝門靜脈：直徑 10 mm（正常約 7–13 mm；多篇超音波平均約 9.6–10.3 mm）；靠近肝門（在肝門處分成左右支）時逐漸收窄到 6.4 mm，接肝內分支
    'portal': lambda u, y: lerp(5.0, 3.2, smoothstep((u - 0.55) / 0.45)),
    # 肝內示意路徑（肝竇為微血管網，這裡只畫成幾條示意管）：入口依面積守恆分成 4 條，
    # 中段最細，出口再匯成肝靜脈（2 條合成 1 條，面積守恆）
    'liver_cap_a': lambda u, y: liver_loop(u),
    'liver_cap_b': lambda u, y: liver_loop(u),
    'liver_cap_c': lambda u, y: liver_loop(u),
    'liver_cap_d': lambda u, y: liver_loop(u),
    # 肝靜脈：直徑 5.6 → 8.4 mm（遠端約 4.7 mm、近下腔靜脈端約 8.4–8.6 mm）
    'hv1': lambda u, y: lerp(2.8, 4.2, smoothstep(u / HV_END['hv1'])),
    'hv2': lambda u, y: lerp(2.8, 4.2, smoothstep(u / HV_END['hv2'])),
    # 下腔靜脈：腎靜脈以下直徑 14 mm → 腎靜脈匯入後約 16 mm → 肝靜脈匯入處約 19 mm（示意性逐段變粗）
    'ivc_lower': lambda u, y: ivc_lower(y),
    'ivc_upper': lambda u, y: lerp(9.5, 10.0, smoothstep(u)),
}
Y_RENAL = 1.10    # 兩條腎靜脈匯入下腔靜脈的高度（si_parts_v1.json 的左右腎靜脈 bbox）
Y_HV = 1.245      # 肝靜脈匯入下腔靜脈的高度（hv1／hv2 的終點）
HV_END = {'hv1': 1.0, 'hv2': 1.0}   # 肝靜脈管畫到下腔靜脈管壁的弧長比例（main() 先算好再填）


def liver_loop(u):
    if u < 0.35:
        return lerp(2.5, 0.8, smoothstep(u / 0.35))
    if u < 0.6:
        return 0.8
    return lerp(0.8, 2.0, smoothstep((u - 0.6) / 0.4))


def ivc_lower(y):
    r = 7.0
    r += 1.0 * smoothstep((y - (Y_RENAL - 0.015)) / 0.03)          # 腎靜脈匯入：14 → 16 mm
    r += 1.5 * smoothstep((y - (Y_RENAL + 0.015)) / (Y_HV - Y_RENAL - 0.015))  # 往上逐漸到肝靜脈匯入處 19 mm
    return r


def main():
    cl = json.load(open(PATH, encoding='utf-8'))
    S = cl['segments']
    report = []
    def apply(sid):
        f = SPEC[sid]
        sg = S[sid]
        pts = sg['points']
        u = arc_fractions(pts)
        r = [round(f(u[i], pts[i][1]) * MM, 5) for i in range(len(pts))]
        before = (sg['radius'][0], sg['radius'][len(pts) // 2], sg['radius'][-1])
        sg['radius'] = r
        tag = 'caliber: tools/anatomy/set_vein_calibers.py (literature, see sources.md)'
        if 'caliber:' not in sg['source']:
            sg['source'] += ' | ' + tag
        sg['tube'] = True     # 核心引擎：這一段畫成單層管，不畫資料集的網格外殼
        report.append((sid, before, (r[0], r[len(r) // 2], r[-1])))

    for sid in ('ivc_lower', 'ivc_upper'):
        apply(sid)
    # 肝靜脈：管畫到下腔靜脈管壁為止（原中心線一路伸到下腔靜脈的軸心，管會穿進腔內變成一截突出的短管）
    ivc_pts = S['ivc_lower']['points'] + S['ivc_upper']['points'][1:]
    ivc_rad = S['ivc_lower']['radius'] + S['ivc_upper']['radius'][1:]
    for hv in ('hv1', 'hv2'):
        pts = S[hv]['points']
        uu = arc_fractions(pts)
        end = 0
        for i, pt in enumerate(pts):
            j = min(range(len(ivc_pts)), key=lambda q: math.dist(ivc_pts[q], pt))
            if math.dist(ivc_pts[j], pt) >= 0.9 * ivc_rad[j]:
                end = i
        HV_END[hv] = max(0.3, uu[min(len(pts) - 1, end + 1)])
        S[hv]['tubeRange'] = [0, round(HV_END[hv], 4)]
    for sid in SPEC:
        if sid not in ('ivc_lower', 'ivc_upper'):
            apply(sid)
    # 下腔靜脈上端：管畫到右心房開口為止（開口以後的線段只給血球流進右心房，不畫管）
    up = S['ivc_upper']['points']
    ra_or = [-0.0127, 1.2832, 0.0839]
    k = min(range(len(up)), key=lambda i: math.dist(up[i], ra_or))
    S['ivc_upper']['tubeRange'] = [0, round(arc_fractions(up)[k], 4)]
    cl['calibers'] = {
        'script': 'tools/anatomy/set_vein_calibers.py',
        'note': 'radius of mesh-vein segments overwritten with literature-based schematic calibers; see sources.md',
        'segments': sorted(SPEC.keys())
    }
    marker = ' | veins in calibers.segments: radius set by set_vein_calibers.py and drawn as single-layer tubes (mesh shells hidden).'
    if marker not in cl['note']:
        cl['note'] += marker
    with open(PATH, 'w', encoding='utf-8') as fh:
        json.dump(cl, fh, ensure_ascii=False, separators=(',', ':'))
    print('%-14s %-26s %-26s' % ('segment', 'before r (mm) first/mid/last', 'after r (mm) first/mid/last'))
    for sid, b, a in report:
        print('%-14s %-26s %-26s' % (sid, '%.1f/%.1f/%.1f' % tuple(x / MM for x in b), '%.2f/%.2f/%.2f' % tuple(x / MM for x in a)))
    print('tubeRange ivc_upper', S['ivc_upper']['tubeRange'], 'hv1', S['hv1']['tubeRange'], 'hv2', S['hv2']['tubeRange'])


if __name__ == '__main__':
    sys.exit(main())
