#!/usr/bin/env python3
"""Cut the unit-4 (fungi) Gemini illustrations into transparent PNGs (2026-10-22).

Based on the unit-2 cut.py (naming_ai_originals). Method: flood the flat background from the image edge
(white tolerance 9, gray tolerance 13), also remove enclosed bg-coloured pockets, then blend a soft ring:
alpha from the colour distance to the background, and subtract the background colour from the ring pixels
so no halo shows on the dark board.

Usage: cut.py <outdir> [job ...]      (no job = all jobs)
Extra options per job (see JOBS): scale, ring width, soft ramp end (t1), minimum component area, order.
"""
import sys, os, json
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

HERE = os.path.dirname(os.path.abspath(__file__))
U = HERE + '/'          # originals sit beside this script
OUT = sys.argv[1]
ONLY = set(sys.argv[2:])
os.makedirs(OUT, exist_ok=True)

G = 'Gemini_Generated_Image_'
# name, file, background, scale, subjects (left->right unless 'order' is given), options
JOBS = [
    ('hyphae', G + 'dsptmadsptmadspt.jpeg', 'gray', 1.0, ['hyphae_a', 'hyphae_b'], {'clear_pockets': (2, 9000), 'pocket_tol': 16, 'pocket_min_width': 4, 'min_blob': 300}),
    ('bread',  G + 'ubvhnpubvhnpubvh.jpeg', 'gray', 1.0, ['bread_mold', 'sporangia_pair'],
        {'clear_pockets': (2, 9000), 'pocket_tol': 8, 'protect': [(0, 0, 1330, 1438), (1480, 150, 1880, 560), (1920, 150, 2360, 580)], 'adopt': 90}),
    ('soil',   G + 'y6yb63y6yb63y6yb.jpeg', 'white', 1.0, ['mushroom_soil'], {'clear_pockets': (2, 3000), 'pocket_tol': 14}),
    ('orange', G + 'hfq210hfq210hfq2.jpeg', 'white', 1.0, ['orange_mold', 'penicillium_brush'], {'clear_pockets': (2, 400), 'pocket_tol': 10, 'only_box': (1900, 100, 2576, 740)}),
]

def bg_color(a):
    ring = np.concatenate([a[:6].reshape(-1, 3), a[-6:].reshape(-1, 3), a[:, :6].reshape(-1, 3), a[:, -6:].reshape(-1, 3)])
    return np.median(ring, axis=0)

def cut(a, kind, opt):
    a = a.astype(np.float32)
    bg = bg_color(a)
    dist = np.sqrt(((a - bg) ** 2).sum(2))
    tol = opt.get('tol', 13 if kind == 'gray' else 9)
    near = dist < tol
    lab, n = ndi.label(near, structure=np.ones((3, 3)))
    border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    bgmask = np.isin(lab, list(border))
    # enclosed pockets of exactly-background colour (lace holes, gaps inside curled tails)
    prot = np.zeros(dist.shape, bool)
    for (px0, py0, px1, py1) in opt.get('protect', []):   # regions where enclosed bg-coloured pockets are real (dark grey spheres)
        prot[py0:py1, px0:px1] = True
    tight = dist < (7 if kind == 'gray' else 5)
    lab2, n2 = ndi.label(tight, structure=np.ones((3, 3)))
    sz2 = ndi.sum(tight, lab2, index=np.arange(1, n2 + 1))
    for i, s in enumerate(sz2, 1):
        if s >= (60 if kind == 'gray' else 140):
            pk = (lab2 == i) & ~prot
            if 'veil' in opt:      # the translucent sheath is close to the backdrop colour: not a hole
                pk &= (np.arange(pk.shape[1]) >= opt['veil'].get('xmax', 1) * pk.shape[1])[None, :]
            bgmask |= pk
    if opt.get('clear_pockets'):
        # tiny background-coloured gaps that Gemini left between two neighbouring cells (the gap is open to the
        # backdrop on both sides but a few pixels of it are walled in by anti-aliasing): clear them as well
        lo, hi = opt['clear_pockets']
        enc = (dist < opt.get('pocket_tol', tol)) & ~bgmask
        lab4, n4 = ndi.label(enc, structure=np.ones((3, 3)))
        sz4 = ndi.sum(enc, lab4, index=np.arange(1, n4 + 1))
        pk = np.isin(lab4, [i for i, s_ in enumerate(sz4, 1) if lo <= s_ <= hi])
        if opt.get('pocket_min_width'):
            # thin slits are real structure (the cross-walls = septa between hyphal cells, painted in the backdrop grey):
            # only pockets that are at least 2*w px wide anywhere are treated as background
            edt = ndi.distance_transform_edt(pk)
            lab5, n5 = ndi.label(pk, structure=np.ones((3, 3)))
            mx = ndi.maximum(edt, lab5, index=np.arange(1, n5 + 1))
            pk = np.isin(lab5, [i for i, m_ in enumerate(mx, 1) if m_ >= opt['pocket_min_width']])
        pk[:, :int(opt.get('clear_xmin', 0) * a.shape[1])] = False
        pk &= ~prot
        if 'only_box' in opt:
            bx0, by0, bx1, by1 = opt['only_box']
            ob = np.zeros(dist.shape, bool); ob[by0:by1, bx0:bx1] = True
            pk &= ob
        print('   cleared tiny pockets:', int(pk.sum()), 'px')
        bgmask |= pk
    for (ex0, ey0, ex1, ey1) in opt.get('erase', []):
        # things Gemini added that do not belong to the subject (a puddle ripple under the rock)
        bgmask[ey0:ey1, ex0:ex1] = True
    # soft ring
    W = opt.get('ring', 3)
    d_to_bg = ndi.distance_transform_edt(~bgmask)
    ring = (d_to_bg > 0) & (d_to_bg <= W)
    t1 = opt.get('t1', 70 if kind == 'gray' else 55)
    alpha = np.ones(dist.shape, np.float32)
    alpha[bgmask] = 0
    soft = np.clip((dist - tol) / (t1 - tol), 0, 1)
    alpha[ring] = np.minimum(1, soft[ring] * 1.15)
    rgb = a.copy()
    ok = ring & (alpha > .06)
    for ch in range(3):
        c = (a[..., ch] - (1 - alpha) * bg[ch]) / np.maximum(alpha, .06)
        rgb[..., ch] = np.where(ok, np.clip(c, 0, 255), rgb[..., ch])
    alpha[ring & (alpha <= .06)] = 0
    if opt.get('soft'):
        # wide soft edge (soil that fades into the grey): colour = nearest interior colour (a little blurred),
        # alpha = how far the pixel has moved from the background colour towards that interior colour
        core = d_to_bg > W
        _, (iy, ix) = ndi.distance_transform_edt(~core, return_indices=True)
        blur = np.stack([ndi.gaussian_filter(a[..., ch], 3) for ch in range(3)], -1)
        F = blur[iy, ix]
        v = F - bg
        den = np.maximum((v ** 2).sum(2), 900.)
        proj = np.clip(((a - bg) * v).sum(2) / den, 0, 1)
        zone = ring & ~bgmask
        al2 = np.where(proj > .04, np.minimum(1, proj * 1.1), 0)
        alpha = np.where(zone, np.minimum(alpha, 1) * 0 + al2, alpha)
        alpha[bgmask] = 0
        keep = np.clip((proj - .6) / .35, 0, 1)[..., None]     # solid pixels keep their own colour (texture)
        rgb = np.where(zone[..., None], F * (1 - keep) + a * keep, rgb)
    if opt.get('fade'):
        # painted fade of the soil into the grey backdrop: pixels that are still close to the grey and lie within
        # fW px of the outside get a lower alpha (the closer to grey, the more transparent), and the colour of the
        # faint ones is taken from the nearest solid interior, so no pale grey haze is left on the dark board
        fW, t1f = opt['fade']
        zone = (d_to_bg > 0) & (d_to_bg <= fW)
        core = d_to_bg > fW
        _, (iy, ix) = ndi.distance_transform_edt(~core, return_indices=True)
        blur = np.stack([ndi.gaussian_filter(a[..., ch], 2) for ch in range(3)], -1)
        F = blur[iy, ix]
        a2 = np.clip((dist - tol) / (t1f - tol), 0, 1)
        a2 = ndi.gaussian_filter(a2, .8)
        alpha = np.where(zone, np.minimum(alpha, a2), alpha)
        keep = np.clip((a2 - .5) / .4, 0, 1)[..., None]
        rgb = np.where(zone[..., None], F * (1 - keep) + rgb * keep, rgb)
        alpha[alpha < .05] = 0
    if opt.get('veil'):
        # translucent jelly sheath (grey on the grey backdrop): keep it translucent instead of a solid grey tube.
        # Greyish pixels near the backdrop colour get alpha = how far they sit from the backdrop towards a pale
        # foreground colour F, and the colour F itself.
        v = opt['veil']
        Fv = np.array(v['F'], np.float32)
        sat = a.max(2) - a.min(2)
        wsat = np.clip((v['sat'][1] - sat) / (v['sat'][1] - v['sat'][0]), 0, 1)
        wdis = np.clip((v['dist'][1] - dist) / (v['dist'][1] - v['dist'][0]), 0, 1)
        cand = (sat < v['sat'][1]) & (dist < v['dist'][1]) & ~bgmask
        lc, nc = ndi.label(cand)                      # 4-connected pieces of greyish pixels
        touch = set(np.unique(lc[ndi.binary_dilation(bgmask, iterations=3) & cand])) - {0}
        cand = np.isin(lc, list(touch))
        w = wsat * wdis * cand
        w[:, int(v.get('xmax', 1) * a.shape[1]):] = 0
        w = ndi.gaussian_filter(w, .7)
        vv = Fv - bg
        proj = np.clip(((a - bg) * vv).sum(2) / (vv ** 2).sum(), 0, 1)
        alpha = np.where(w > 0, alpha * (1 - w) + proj * w, alpha)
        rgb = np.where(w[..., None] > 0, rgb * (1 - w[..., None]) + Fv * w[..., None], rgb)
        # inside the sheath outline nothing is fully clear: a floor alpha avoids dark pin-holes where the drawn
        # sheath happens to equal the backdrop colour
        left = np.zeros(alpha.shape, bool); left[:, :int(v.get('xmax', 1) * a.shape[1])] = True
        inside = ndi.binary_fill_holes(ndi.binary_closing(alpha > .1, iterations=10)) & left
        lowa = inside & (alpha < v.get('floor', .17))
        alpha = np.where(lowa, v.get('floor', .17), alpha)
        rgb = np.where(lowa[..., None], Fv, rgb)
    return rgb, alpha, bg, bgmask

def order_comps(comps, how, shape):
    # comps: list of (cx, cy, x0, idx, area)
    if how == 'diatoms':
        H = shape[0]
        # row-major: rows by centroid y bands (fractions of the image height), then by x
        def row(c):
            y = c[1] / H
            return 0 if y < .21 else (1 if y < .63 else 2)
        return sorted(comps, key=lambda c: (row(c), c[0]))
    if how == 'paramecia':
        # left-top, right-top, bottom
        top = sorted([c for c in comps if c[1] < shape[0] * .6], key=lambda c: c[0])
        bot = [c for c in comps if c[1] >= shape[0] * .6]
        return top + bot
    return sorted(comps, key=lambda c: c[0])

report = {}
for name, f, kind, scale, subjects, opt in JOBS:
    if ONLY and name not in ONLY: continue
    im = Image.open(U + f).convert('RGB')
    a = np.asarray(im)
    rgb, alpha, bg, bgmask = cut(a, kind, opt)
    if opt.get('min_blob'):
        # isolated light specks inside the cluster (Gemini left two stray dots among the hyphae): removed and logged
        lb, nb = ndi.label(alpha > .3, structure=np.ones((3, 3)))
        szb = ndi.sum(alpha > .3, lb, index=np.arange(1, nb + 1))
        for i_, s_ in enumerate(szb, 1):
            if s_ < opt['min_blob']:
                ys_, xs_ = np.nonzero(lb == i_)
                print('   removed blob', int(s_), 'px at', int(xs_.mean()), int(ys_.mean()))
        alpha = np.where(np.isin(lb, [i_ for i_, s_ in enumerate(szb, 1) if s_ < opt['min_blob']]), 0, alpha)
    solid = alpha > opt.get('solid', .3)
    big = ndi.binary_dilation(solid, iterations=opt.get('merge', 14))
    lab, n = ndi.label(big)
    if opt.get('adopt'):
        # loose single spores that fell away from the broken sporangium are separate blobs: adopt every blob of >= 150 px
        # that lies within `adopt` px of a big component into that component (and log it)
        areas = {i: int((solid & (lab == i)).sum()) for i in range(1, n + 1)}
        bigs = [i for i, a_ in areas.items() if a_ >= opt.get('minarea', 4000)]
        for i, a_ in areas.items():
            if i in bigs or a_ < 150: continue
            best = None
            for j in bigs:
                d_ = ndi.distance_transform_edt(lab != j)[lab == i].min()
                if d_ <= opt['adopt'] and (best is None or d_ < best[0]): best = (d_, j)
            if best:
                print('   adopted loose blob', a_, 'px (%.0f px from the subject)' % best[0])
                lab[lab == i] = best[1]
    comps = []
    for i in range(1, n + 1):
        m = lab == i
        area = int((solid & m).sum())
        if area < opt.get('minarea', 4000): continue
        ys, xs = np.nonzero(m & solid)
        comps.append((float(xs.mean()), float(ys.mean()), int(xs.min()), i, area))
    if 'xsplit' in opt:
        # several loose pieces make one subject (a bunch of rods, a bunch of spirals): group by centroid x
        cuts = opt['xsplit']
        groups = {}
        for c in comps:
            g = sum(c[0] > x for x in cuts)
            groups.setdefault(g, []).append(c)
        merged = []
        for g in sorted(groups):
            cs = groups[g]
            ids = [c[3] for c in cs]
            area = sum(c[4] for c in cs)
            cx = sum(c[0] * c[4] for c in cs) / area; cy = sum(c[1] * c[4] for c in cs) / area
            lab = np.where(np.isin(lab, ids), ids[0], np.where(lab == ids[0], 0, lab))
            merged.append((cx, cy, min(c[2] for c in cs), ids[0], area))
        comps = merged
    else:
        comps = order_comps(comps, opt.get('order'), a.shape)
    print(name, 'components', [(int(c[0]), int(c[1]), c[4]) for c in comps])
    assert len(comps) == len(subjects), (name, len(comps), len(subjects))
    report[name] = {'bg': [int(v) for v in bg], 'size': im.size, 'scale': scale}
    for (cx, cy, _, i, area), sub in zip(comps, subjects):
        m = lab == i
        al = np.where(m, alpha, 0)
        ys, xs = np.nonzero(al > .02)
        x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
        pad = 4
        x0, y0 = max(0, x0 - pad), max(0, y0 - pad); x1, y1 = min(al.shape[1], x1 + pad), min(al.shape[0], y1 + pad)
        out = np.dstack([np.clip(rgb, 0, 255).astype(np.uint8), (al * 255).astype(np.uint8)])[y0:y1, x0:x1]
        img = Image.fromarray(out, 'RGBA')
        w, h = img.size
        if scale != 1:
            img = img.resize((round(w * scale), round(h * scale)), Image.LANCZOS)
        img.save(f'{OUT}/{sub}.png', optimize=True)
        report[name][sub] = {'size': list(img.size), 'centroid': [round(cx), round(cy)], 'area': area}
        print('  ', sub, img.size, 'centroid', (round(cx), round(cy)), 'area', area)
rp = OUT + '/_report.json'
old = json.load(open(rp)) if os.path.exists(rp) else {}
old.update(report)
json.dump(old, open(rp, 'w'), ensure_ascii=False, indent=1)
