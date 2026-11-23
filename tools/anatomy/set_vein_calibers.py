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
    'liver_cap_a': lambda u, y: liver_loop(u, 2.2, 2.0),
    'liver_cap_b': lambda u, y: liver_loop(u, 2.5, 2.2),
    'liver_cap_c': lambda u, y: liver_loop(u, 2.2, 2.2),
    'liver_cap_d': lambda u, y: liver_loop(u, 2.2, 2.0),
    # 肝靜脈：直徑 5.6 → 8.4 mm（遠端約 4.7 mm、近下腔靜脈端約 8.4–8.6 mm）
    # （2026-11-23 老師：肝靜脈不要像喇叭／錐形殘端）只畫到下腔靜脈管壁的那一小段（10～15 mm）若從 2.8 脹到 4.2，斜率 0.2 以上就是錐形；
    # 改成 2.2（＝肝內示意管的出口，接點同粗）→ 3.6，而且用「線性與 smoothstep 各半」的緩坡（最大斜率約 0.12），肝內示意管（liver_loop）的出口端也提早開始變粗
    'hv1': lambda u, y: lerp(2.2, 3.6, hv_ease(u / HV_END['hv1'])),
    'hv2': lambda u, y: lerp(2.2, 3.6, hv_ease(u / HV_END['hv2'])),
    # 下腔靜脈：腎靜脈以下直徑 14 mm → 腎靜脈匯入後約 16 mm → 肝靜脈匯入處約 19 mm（示意性逐段變粗）
    'ivc_lower': lambda u, y: ivc_lower(y),
    'ivc_upper': lambda u, y: lerp(9.5, 10.0, smoothstep(u)),
}
Y_RENAL = 1.10    # 兩條腎靜脈匯入下腔靜脈的高度（si_parts_v1.json 的左右腎靜脈 bbox）
Y_HV = 1.245      # 肝靜脈匯入下腔靜脈的高度（hv1／hv2 的終點）
HV_END = {'hv1': 1.0, 'hv2': 1.0}   # 肝靜脈管畫到下腔靜脈管壁的弧長比例（main() 先算好再填）


def liver_loop(u, r0=2.5, r1=2.2):
    # r0＝入口端（接門靜脈）、r1＝出口端（接肝靜脈）。4 條裡只有 1 條和母管同粗（同軸接續、不封口），其餘 0.88～0.9 倍：
    # 較細的子管從母管裡長出來、不和母管壁共面（共面會閃爍成鋸齒）；入口同理，出口 2 條匯成 1 條也是 1 條同粗、1 條細
    if u < 0.35:
        return lerp(r0, 0.8, smoothstep(u / 0.35))
    if u < 0.5:
        return 0.8
    return lerp(0.8, r1, smoothstep((u - 0.5) / 0.5))   # 出口端 2.2＝肝靜脈起端同粗（接點不留台階），從一半處就慢慢變粗


def hv_ease(w):
    w = min(max(w, 0.0), 1.0)
    return 0.5 * w + 0.5 * smoothstep(w)


def ivc_lower(y):
    r = 7.0
    r += 1.0 * smoothstep((y - (Y_RENAL - 0.015)) / 0.03)          # 腎靜脈匯入：14 → 16 mm
    r += 1.5 * smoothstep((y - (Y_RENAL + 0.015)) / (Y_HV - Y_RENAL - 0.015))  # 往上逐漸到肝靜脈匯入處 19 mm
    return r


sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))


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
        # 管口要整個埋進下腔靜脈腔內（管口圓面上每一點都在下腔靜脈管壁內 0.94 倍半徑以內），否則管口的平切面會露在管壁外，
        # 看起來像一截被切平的殘管（老師 2026-11-23：小腸路線終點仍有平口）。從起端往下腔靜脈找第一個「整個圓面都埋進去」的點。
        R_END = 3.6 * MM
        def disc_inside(i):
            a_, b_ = pts[max(i - 1, 0)], pts[min(i + 1, len(pts) - 1)]
            tg = [b_[c] - a_[c] for c in range(3)]; n_ = math.sqrt(sum(x * x for x in tg)) or 1.0; tg = [x / n_ for x in tg]
            ref = [0, 1, 0] if abs(tg[1]) < 0.9 else [1, 0, 0]
            e1 = [tg[1] * ref[2] - tg[2] * ref[1], tg[2] * ref[0] - tg[0] * ref[2], tg[0] * ref[1] - tg[1] * ref[0]]
            m_ = math.sqrt(sum(x * x for x in e1)) or 1.0; e1 = [x / m_ for x in e1]
            e2 = [tg[1] * e1[2] - tg[2] * e1[1], tg[2] * e1[0] - tg[0] * e1[2], tg[0] * e1[1] - tg[1] * e1[0]]
            for k in range(12):
                th = 2 * math.pi * k / 12
                q = [pts[i][c] + R_END * (math.cos(th) * e1[c] + math.sin(th) * e2[c]) for c in range(3)]
                j = min(range(len(ivc_pts)), key=lambda z: math.dist(ivc_pts[z], q))
                if math.dist(ivc_pts[j], q) > 0.94 * ivc_rad[j]:
                    return False
            return True
        end = len(pts) - 1
        for i in range(len(pts)):
            if disc_inside(i):
                end = i; break
        HV_END[hv] = max(0.3, uu[min(len(pts) - 1, end)])
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
    import polish_vessels   # 設完口徑後重新整理接點（半徑連續、封口、斜率限制；老師 2026-11-23）
    polish_vessels.polish_path(PATH)
    print('%-14s %-26s %-26s' % ('segment', 'before r (mm) first/mid/last', 'after r (mm) first/mid/last'))
    for sid, b, a in report:
        print('%-14s %-26s %-26s' % (sid, '%.1f/%.1f/%.1f' % tuple(x / MM for x in b), '%.2f/%.2f/%.2f' % tuple(x / MM for x in a)))
    print('tubeRange ivc_upper', S['ivc_upper']['tubeRange'], 'hv1', S['hv1']['tubeRange'], 'hv2', S['hv2']['tubeRange'])


if __name__ == '__main__':
    sys.exit(main())
