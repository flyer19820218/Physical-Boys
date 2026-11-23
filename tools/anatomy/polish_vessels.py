#!/usr/bin/env python3
"""polish_vessels.py — 血管接點整理（老師 2026-11-23：「不要錐形殘端／台階，血管要慢慢變細或慢慢變粗」）

對象：assets/biology/anatomy3d/*_centerlines_v1.json（小腸 si、腎 kidney、肝 liver、肺 lung、腦 brain、總覽 circuit、心臟 heart）。
可重複執行（冪等）：跑第二次幾乎不再改動。各器官的 build_*.py 產生 JSON 後，最後一步呼叫 polish_file()。

做三件事（規則出處：docs/ht3d_接力指南.md §5b、§5c、§5c-2）
 1. 接點半徑連續：把「端點相接」的血管（同一點、動靜脈相容）分組成接點，
    - 分叉（1 進多出）：母管末端沿路漸細到「最粗的子管」起點半徑（同軸接續）；較細的子管從管壁分出（埋在母管內）。
    - 匯流（多進 1 出）：最粗的支流末端漸粗到匯流後的管半徑；較細的支流併入管壁。
    - 多對多（微血管網節點）：全部漸變到同一個半徑。
    漸變長度 ≥ 6×落差（斜率 ≤ 約 0.17）且至少佔該段 35%，用 smootherstep 混合，不是台階。
 2. 封口：只有「同軸（≤12°）、半徑一致」的兩段才兩邊都不封；管口埋進別的血管內部（含管口圓面）才不封；
    其餘接點（彎折、多叉節點）一律封圓頭（半球），不留平口斷面。游離端點（沒有任何鄰居）不動。
 4. 游離端（沒接到任何血管、半徑 ≤4 mm 的動脈／靜脈）：最後 max(7×半徑, 4 mm)（至多佔該段 45%）漸細到 0.4 倍，再封圓頭。
    例外：JSON 段寫了 mouthStart／mouthEnd: true 的端點（管口接進心房壁、主動脈竇壁）不漸細。
 3. 全段斜率限制：任何一段，每 mm 長度的半徑變化 ≤ 0.22（半角約 12°），超過就用上下包絡平均壓平，不會出現短錐形。

用法：python3 tools/anatomy/polish_vessels.py [--audit] [--dry] [名稱…]（名稱：si kidney liver lung brain circuit heart；省略＝全部）
"""
import json, math, os, sys
import numpy as np
from scipy.spatial import cKDTree

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'assets', 'biology', 'anatomy3d')
FAM = {'artery': 'A', 'arteriole': 'A', 'vein': 'V', 'venule': 'V', 'capillary': 'C', 'sinusoid': 'C'}
COMPAT = {('A', 'A'), ('A', 'C'), ('C', 'A'), ('C', 'C'), ('C', 'V'), ('V', 'C'), ('V', 'V')}
SLOPE = 0.22          # 每 mm 長度的半徑變化上限
BLEND_K = 7.5         # 漸變長度 ≥ BLEND_K × 落差（smoothstep 最陡處 1.5 倍平均斜率 → 最大斜率約 0.2）
BLEND_FRAC = 0.35     # 且至少佔該段長度的這個比例
COAX_DEG = 12.0       # 同軸（兩邊都不封口）的最大轉角
TIP_MIN, TIP_MAXR = 0.4, 0.004   # 游離端（血管的盡頭）漸細到 0.4 倍；只處理半徑 ≤4 mm 的動脈／靜脈（大血管的游離端是場景截斷處，不動）
BURY = 0.92           # 管口圓面完全落在別的血管管腔內（半徑比例）


def unit(v):
    n = float(np.linalg.norm(v))
    return v / n if n > 1e-12 else v


def arclen(P):
    return np.concatenate([[0.0], np.cumsum(np.linalg.norm(np.diff(P, axis=0), axis=1))])


def smootherstep(x):   # 名稱沿用；實際用 smoothstep（3x²−2x³），最陡處只有平均斜率的 1.5 倍
    x = np.clip(x, 0.0, 1.0)
    return x * x * (3 - 2 * x)


def load(name):
    path = os.path.join(ROOT, f'{name}_centerlines_v1.json')
    return path, json.load(open(path))


def vessel_ids(S):
    return [k for k, s in S.items() if s.get('kind') in FAM and len(s['points']) >= 2 and len(s['radius']) == len(s['points'])]


class Net:
    """把一份 centerlines 的血管段攤成陣列，並建立端點接點。"""

    def __init__(self, S):
        self.S = S
        self.ids = vessel_ids(S)
        self.P = [np.array(S[k]['points'], float) for k in self.ids]
        self.R = [np.array(S[k]['radius'], float) for k in self.ids]
        self.s = [arclen(p) for p in self.P]
        self.fam = [FAM[S[k]['kind']] for k in self.ids]
        allp = np.vstack(self.P)
        self.owner = np.concatenate([np.full(len(p), i) for i, p in enumerate(self.P)])
        self.tree_all = cKDTree(allp)
        self.allp = allp
        self.allr = np.concatenate(self.R)
        self.build_ends()

    def tangent_in(self, i, end):
        """端點處、朝向這一段內部的單位方向（取離端點約 1.5 倍半徑的點，至少隔一個點）"""
        P, s, R = self.P[i], self.s[i], self.R[i]
        n = len(P)
        if end == 's':
            want = s[0] + max(1.5 * R[0], 1e-4)
            j = int(np.searchsorted(s, want)); j = min(max(j, 1), n - 1)
            return unit(P[j] - P[0])
        want = s[-1] - max(1.5 * R[-1], 1e-4)
        j = int(np.searchsorted(s, want)) - 1; j = min(max(j, 0), n - 2)
        return unit(P[j] - P[-1])

    def build_ends(self):
        self.ends = []   # (seg i, 's'|'e')
        pts = []
        for i in range(len(self.ids)):
            for e in ('s', 'e'):
                self.ends.append((i, e)); pts.append(self.P[i][0] if e == 's' else self.P[i][-1])
        self.endpt = np.array(pts)
        self.endr = np.array([self.R[i][0] if e == 's' else self.R[i][-1] for i, e in self.ends])
        parent = list(range(len(self.ends)))

        def find(a):
            while parent[a] != a:
                parent[a] = parent[parent[a]]; a = parent[a]
            return a
        tree = cKDTree(self.endpt)
        rmax = float(self.endr.max()) if len(self.endr) else 0.0
        for a, b in tree.query_pairs(rmax * 0.8 + 0.0004):
            ia, ib = self.ends[a][0], self.ends[b][0]
            if ia == ib or (self.fam[ia], self.fam[ib]) not in COMPAT:
                continue
            d = float(np.linalg.norm(self.endpt[a] - self.endpt[b]))
            if d <= 0.5 * max(self.endr[a], self.endr[b]) + 0.0003:
                parent[find(a)] = find(b)
        groups = {}
        for a in range(len(self.ends)):
            groups.setdefault(find(a), []).append(a)
        self.clusters = [g for g in groups.values() if len(g) >= 2 and len({self.ends[a][0] for a in g}) >= 2]
        self.end_cluster = {}
        for ci, g in enumerate(self.clusters):
            for a in g:
                self.end_cluster[a] = ci

    def touches_body(self, a, tol=1.1):
        """端點 a 是否碰到別的血管（端點離別段中心線的距離 ≤ 1.1×（該處半徑＋0.3 倍本端半徑））。碰不到＝游離端（血管的盡頭）"""
        i = self.ends[a][0]; E = self.endpt[a]; r = self.endr[a]
        for j in range(len(self.ids)):
            if j == i: continue
            P = self.P[j]
            if float(np.linalg.norm(P - E, axis=1).min()) > 0.08: continue
            A, B = P[:-1], P[1:]; AB = B - A
            tt = np.clip(((E - A) * AB).sum(1) / np.maximum((AB * AB).sum(1), 1e-18), 0.0, 1.0)
            dd = np.linalg.norm(A + AB * tt[:, None] - E, axis=1); k = int(dd.argmin())
            rr = self.R[j][k] * (1 - tt[k]) + self.R[j][k + 1] * tt[k]
            if dd[k] <= tol * (rr + 0.3 * r): return True
        return False

    def buried(self, a):
        """端點 a 的管口圓面是否完全落在『別的血管段』的管腔內（那就不必封口）"""
        i = self.ends[a][0]; E = self.endpt[a]; r = self.endr[a]
        idx = self.tree_all.query_ball_point(E, max(0.03, 3 * r))
        for q in idx:
            o = self.owner[q]
            if o == i:
                continue
            Rq = self.allr[q]
            if Rq > r * 1.05 and float(np.linalg.norm(self.allp[q] - E)) + r <= BURY * Rq:
                return True
        return False


def target_radius(net, g):
    """回傳 (目標半徑 rj 或 None, 接點種類, 進入的成員, 離開的成員, 全部成員, 要漸變的成員集合, 主線(進,出) 或 None)。
    rj 是 None＝兩邊差太多（側支從粗幹分出）：不漸變，只靠封口／埋入處理。"""
    mem = []
    for a in g:
        i, e = net.ends[a]
        mem.append(dict(a=a, i=i, e=e, r=float(net.endr[a]), t=net.tangent_in(i, e)))
    ins = [m for m in mem if m['e'] == 'e']     # 血流抵達這一點（該段的末端）
    outs = [m for m in mem if m['e'] == 's']    # 血流從這一點出發（該段的起端）

    def main_of(group, ref=None):
        """群組裡最粗的一條；半徑相近（差 <10%）時挑和對面主管最同向的"""
        rmax = max(m['r'] for m in group)
        cand = [m for m in group if m['r'] >= 0.9 * rmax]
        if ref is None or len(cand) == 1:
            return max(cand, key=lambda m: m['r'])
        return max(cand, key=lambda m: -float(np.dot(m['t'], ref['t'])))   # 流向相反的 t 內積最負＝最同軸
    rj, kind, main = None, 'hub', None
    if len(ins) == 1 and len(outs) >= 2:        # 分叉
        kind = 'branch'; rp = ins[0]['r']; main_o = main_of(outs, ins[0]); ro = main_o['r']; main = (ins[0], main_o)
        if ro >= rp: rj = rp if ro / rp <= 6 else None
        else: rj = ro if rp / ro <= 3 else None
    elif len(ins) >= 2 and len(outs) == 1:      # 匯流
        kind = 'merge'; ro = outs[0]['r']; main_i = main_of(ins, outs[0]); ri = main_i['r']; main = (main_i, outs[0])
        if ro >= ri: rj = ro if ro / ri <= 1.3 else (ri if ro / ri <= 6 else None)
        else: rj = ro if ri / ro <= 3 else None
    elif len(ins) == 1 and len(outs) == 1:      # 單接兩段
        kind = 'join'; ri, ro = ins[0]['r'], outs[0]['r']; main = (ins[0], outs[0])
        big, small = max(ri, ro), min(ri, ro)
        if big / small <= 1.6: rj = math.sqrt(ri * ro)
        elif ro > ri and ro / ri <= 6: rj = ri      # 下游起端比上游末端粗很多：下游起端漸細（靜脈的起頭）
        else: rj = None                             # 上游粗很多：側支從粗幹末端分出
    else:                                           # 多進多出／全進／全出（微血管網節點）
        rs = sorted(m['r'] for m in mem); med = rs[len(rs) // 2]
        rj = med; kind = 'hub'
    if rj is None:
        return None, kind, ins, outs, mem, set(), main
    blend = set()
    for m in mem:
        if kind == 'hub' and not (rj / 1.6 <= m['r'] <= rj * 1.6):
            continue
        if kind == 'branch' and m['e'] == 's' and m is not main[1] and m['r'] <= 0.95 * rj:
            continue                                # 較細的子管：半徑不動，埋在母管內
        if kind == 'merge' and m['e'] == 'e' and m is not main[0] and m['r'] <= 0.95 * rj:
            continue                                # 較細的支流：半徑不動，併入主管壁
        if abs(rj - m['r']) / max(rj, m['r']) < 0.01:
            continue
        blend.add(m['a'])
    return rj, kind, ins, outs, mem, blend, main


def blend_end(R, s, end, rj):
    """把這一段的 end 端半徑漸變到 rj（其餘位置幾乎不動）。回傳新的半徑陣列"""
    L = float(s[-1])
    r0 = R[0] if end == 's' else R[-1]
    d = rj - r0
    if abs(d) < 1e-9 or L <= 0:
        return R
    ell = min(0.9 * L, max(BLEND_K * abs(d), BLEND_FRAC * L))
    x = (s if end == 's' else (L - s)) / ell
    return R + d * (1.0 - smootherstep(x))


def lipschitz(R, s, kappa):
    """上下包絡的平均：原本斜率就 ≤ kappa 的地方完全不動；超過的地方壓平成 kappa"""
    n = len(R)
    D = np.abs(s[:, None] - s[None, :])
    lo = (R[None, :] + kappa * D).min(axis=1)
    hi = (R[None, :] - kappa * D).max(axis=1)
    return 0.5 * (lo + hi)


def relax_slopes(R, s, kappa, pin_s=False, pin_e=False):
    """相鄰兩點的半徑差 ≤ kappa×點距：超過的成對往中間拉（被釘住的端點不動；釘住解不開時放開）。只動超標的地方。"""
    R = R.copy(); n = len(R); ds = np.maximum(np.diff(s), 1e-9)
    for pin in ((pin_s, pin_e), (False, False)):
        for it in range(3000):
            moved = False
            for j in range(n - 1):
                lim = kappa * ds[j]; dr = R[j + 1] - R[j]
                if abs(dr) > lim * 1.0005:
                    ex = abs(dr) - lim; sg = 1.0 if dr > 0 else -1.0
                    wa = 0.0 if (pin[0] and j == 0) else 1.0
                    wb = 0.0 if (pin[1] and j + 1 == n - 1) else 1.0
                    if wa + wb == 0: continue
                    R[j] += sg * ex * wa / (wa + wb); R[j + 1] -= sg * ex * wb / (wa + wb); moved = True
            if not moved:
                return R
    return R


def slope_worst(R, s):
    w = max(0.0004, 0.6 * float(R.min())); worst = 0.0
    for j in range(len(s)):
        q = int(np.searchsorted(s, s[j] + w))
        if q >= len(s): q = len(s) - 1
        if q > j and (s[q] - s[j]) <= 0.012:
            worst = max(worst, abs(R[q] - R[j]) / max(s[q] - s[j], 1e-9))
    return worst


def local_tangent(net, a):
    """端點 a 處、朝向這一段內部的『最末一小段』方向（不像 tangent_in 取 1.5 倍半徑外的弦）"""
    i, e = net.ends[a]; P = net.P[i]
    return unit(P[1] - P[0]) if e == 's' else unit(P[-2] - P[-1])


def is_coax(m_in, m_out, net):
    """兩段是否同軸接續（兩邊都不封口）：①1.5 倍半徑處的弦方向轉角 ≤12°；或 ②接點處最末一小段的方向轉角 ≤8°（切線連續、只是之後彎出去：
    例如肝內示意管以 Bezier 切線相接肝靜脈起端），這時兩個管口是同一個平面，不封口反而沒有接縫。半徑差都要 ≤3%。"""
    cosang = float(np.dot(m_in['t'], m_out['t']))
    ang = math.degrees(math.acos(max(-1.0, min(1.0, -cosang))))
    ra, rb = net.endr[m_in['a']], net.endr[m_out['a']]
    if abs(ra - rb) / max(ra, rb) > 0.03:
        return False
    if ang <= COAX_DEG:
        return True
    c2 = float(np.dot(local_tangent(net, m_in['a']), local_tangent(net, m_out['a'])))
    ang2 = math.degrees(math.acos(max(-1.0, min(1.0, -c2))))
    return ang2 <= 8.0 and ang <= 30.0


def polish(d, verbose=True):
    S = d['segments']
    net = Net(S)
    stats = dict(clusters=len(net.clusters), kinds={}, ends_changed=0, caps_on=0, caps_off=0, slope_fixed=0, side=0)
    # A. 接點半徑連續（先做；之後再逐段限制斜率，接點端的半徑釘住不動）
    plan = []
    for g in net.clusters:
        res = target_radius(net, g)
        plan.append(res)
        stats['kinds'][res[1]] = stats['kinds'].get(res[1], 0) + 1
        if res[0] is None: stats['side'] += 1
    deltas = [np.zeros_like(r) for r in net.R]
    for rj, kind, ins, outs, mem, blend, main in plan:
        if rj is None: continue
        for m in mem:
            if m['a'] not in blend: continue
            i, e = m['i'], m['e']
            L = float(net.s[i][-1]); dlt = rj - m['r']
            maxd = 0.9 * L / BLEND_K               # 這段長度內，漸變得動的最大落差
            if abs(dlt) > maxd: dlt = math.copysign(maxd, dlt)
            nb = blend_end(net.R[i], net.s[i], e, m['r'] + dlt)
            deltas[i] += nb - net.R[i]
            stats['ends_changed'] += 1
    # A2. 游離端（沒有接到任何血管的盡頭）漸細成細尖，再封圓頭：不留「一根粗管直接切斷」的殘端
    for a, (i, e) in enumerate(net.ends):
        if a in net.end_cluster or S[net.ids[i]]['kind'] not in ('artery', 'vein', 'arteriole', 'venule'): continue
        if S[net.ids[i]].get('mouthStart' if e == 's' else 'mouthEnd'): continue   # 開口接進心房壁／主動脈竇壁的管口（口徑要維持，不能漸細）
        r = float(net.endr[a])
        if not (0.0003 <= r <= TIP_MAXR) or net.touches_body(a): continue
        s, R = net.s[i], net.R[i] + deltas[i]; L = float(s[-1])
        Lt = min(0.45 * L, max(7.0 * r, 0.004)); x = (s if e == 's' else (L - s)) / Lt
        r_in = float(np.interp(Lt, s if e == 's' else (L - s)[::-1], R if e == 's' else R[::-1]))
        if R[0 if e == 's' else -1] < 0.85 * r_in: continue      # 已經漸細（重跑時）
        f = TIP_MIN + (1.0 - TIP_MIN) * smootherstep(x)
        deltas[i] += R * (f - 1.0); stats['tips'] = stats.get('tips', 0) + 1
    pinned = set(net.end_cluster.keys())
    # B. 每一段的斜率限制（接點端釘住）
    for i, k in enumerate(net.ids):
        R = net.R[i] + deltas[i]; s = net.s[i]
        if len(s) >= 3 and slope_worst(R, s) > SLOPE * 1.02:
            ps = (i * 2) in pinned; pe = (i * 2 + 1) in pinned
            R = relax_slopes(R, s, SLOPE, ps, pe); stats['slope_fixed'] += 1
        net.R[i] = R
        S[k]['radius'] = [round(float(x), 6) for x in R]
    net.endr = np.array([net.R[i][0] if e == 's' else net.R[i][-1] for i, e in net.ends])
    # C. 封口（半徑已定案：重建一份網路再判斷，埋入檢查才用得到新半徑）
    net = Net(S)
    for g in net.clusters:
        rj, kind, ins, outs, mem, blend, main = target_radius(net, g)
        coax_pair = None
        if main is not None and is_coax(main[0], main[1], net):
            coax_pair = (main[0]['a'], main[1]['a'])
        for m in mem:
            key = 'capStart' if m['e'] == 's' else 'capEnd'
            seg = S[net.ids[m['i']]]
            if coax_pair and m['a'] in coax_pair:
                want = False
            else:
                want = False if net.buried(m['a']) else True
            old = seg.get(key, True)
            seg[key] = want
            if want and not old: stats['caps_on'] += 1
            if (not want) and old: stats['caps_off'] += 1
    return stats


def audit(d, label='', top=6):
    """不改檔：量接點半徑落差、斜率、外露平口。"""
    S = d['segments']; net = Net(S)
    bad_step, bad_slope, exposed = [], [], []
    for g in net.clusters:
        rj, kind, ins, outs, mem, blend, main = target_radius(net, g)
        if main is not None:
            a, b = main
            ra, rb = net.endr[a['a']], net.endr[b['a']]
            if rj is not None and abs(ra - rb) / max(ra, rb) > 0.06:
                bad_step.append((net.ids[a['i']], net.ids[b['i']], round(ra * 1000, 3), round(rb * 1000, 3)))
            coax = is_coax(a, b, net)
        else:
            coax = False
        for m in mem:
            seg = S[net.ids[m['i']]]
            capped = seg.get('capStart' if m['e'] == 's' else 'capEnd', True)
            if not capped and not (coax and m['a'] in (main[0]['a'], main[1]['a'])) and not net.buried(m['a']):
                exposed.append((net.ids[m['i']], m['e'], round(m['r'] * 1000, 3)))
    for i, k in enumerate(net.ids):
        worst = slope_worst(net.R[i], net.s[i])
        if worst > SLOPE * 1.1:
            bad_slope.append((k, round(worst, 3)))
    print(f'  [{label}] 接點 {len(net.clusters)}｜半徑落差>6%的主線接點 {len(bad_step)}｜外露平口 {len(exposed)}｜斜率>{SLOPE * 1.1:.2f}的段 {len(bad_slope)}')
    for nm, v in (('落差', bad_step), ('外露', exposed), ('斜率', bad_slope)):
        if v: print(f'     {nm}例：', v[:top])
    return dict(step=len(bad_step), exposed=len(exposed), slope=len(bad_slope), clusters=len(net.clusters))


def polish_path(path, dry=False, quiet=False, label=None):
    """給各個 build_*.py 在寫完 JSON 後呼叫：python 裡 import polish_vessels; polish_vessels.polish_path(輸出路徑)"""
    d = json.load(open(path))
    st = polish(d)
    if not quiet:
        print(f'  polish {label or os.path.basename(path)}: 接點 {st["clusters"]}（{st["kinds"]}）｜半徑改 {st["ends_changed"]} 端｜補封口 {st["caps_on"]}／取消封口 {st["caps_off"]}｜壓平斜率 {st["slope_fixed"]} 段｜游離端漸細 {st.get("tips", 0)} 處')
    if not dry:
        with open(path, 'w') as f:
            json.dump(d, f, ensure_ascii=False, separators=(',', ':'))
    return d, st


def polish_file(name, dry=False, quiet=False):
    path, d = load(name)
    st = polish(d)
    if not quiet:
        print(f'  {name}: 接點 {st["clusters"]}（{st["kinds"]}）｜半徑改 {st["ends_changed"]} 端｜補封口 {st["caps_on"]}／取消封口 {st["caps_off"]}｜壓平斜率 {st["slope_fixed"]} 段｜游離端漸細 {st.get("tips", 0)} 處')
    if not dry:
        with open(path, 'w') as f:
            json.dump(d, f, ensure_ascii=False, separators=(',', ':'))
    return d, st


if __name__ == '__main__':
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    names = args or ['si', 'kidney', 'liver', 'lung', 'brain', 'circuit', 'heart']
    if '--audit' in sys.argv and '--dry' in sys.argv:
        for n in names:
            d, st = polish_file(n, dry=True)
            audit(d, n + '（整理後，未存檔）')
    elif '--audit' in sys.argv:
        for n in names:
            audit(load(n)[1], n)
    else:
        for n in names:
            polish_file(n, dry='--dry' in sys.argv)
