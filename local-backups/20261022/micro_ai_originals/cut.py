#!/usr/bin/env python3
"""Cut the unit-3 (microorganisms) Gemini illustrations into single transparent PNGs.

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
    ('bacteria',  G + '30lvef30lvef30lv.jpeg', 'gray',  1.0,  ['cocci_cluster', 'cocci_chain', 'rods', 'spirals'],
        {'xsplit': [500, 1000, 1650]}),
    ('paramecia', G + 'kyyt1qkyyt1qkyyt.jpeg', 'gray',  1.0,  ['paramecium_a', 'paramecium_b', 'paramecium_c'],
        {'order': 'paramecia', 't1': 45}),
    ('cyano',     G + 'i0gn73i0gn73i0gn.jpeg', 'gray',  1.0,  ['nostoc_chain', 'oscillatoria'], {'fill_pockets': 150, 'fill_xmin': .5, 'veil': {'F': (225, 235, 238), 'sat': (16, 34), 'dist': (50, 80), 'xmax': .5}}),
    ('rain',      G + 'rs6r1xrs6r1xrs6r.jpeg', 'gray',  .9,   ['nostoc_dry', 'nostoc_wet'], {'fade': (14, 62)}),
    ('amoebae',   G + '26xteb26xteb26xt.jpeg', 'gray',  1.0,  ['amoeba_moving', 'amoeba_engulfing'], {}),
    ('diatoms',   G + 'ku35ltku35ltku35.jpeg', 'gray',  1.0,  ['diatom_%02d' % i for i in range(1, 14)], {'order': 'diatoms'}),
    ('kelp',      G + 'p43nlvp43nlvp43n.jpeg', 'white', .85,  ['kelp'], {}),
    ('fungi_algae', G + '90x5nr90x5nr90x5.jpeg', 'white', 1.0, ['red_alga', 'nori', 'shiitake', 'reishi'], {}),
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
    tight = dist < (7 if kind == 'gray' else 5)
    lab2, n2 = ndi.label(tight, structure=np.ones((3, 3)))
    sz2 = ndi.sum(tight, lab2, index=np.arange(1, n2 + 1))
    for i, s in enumerate(sz2, 1):
        if s >= (60 if kind == 'gray' else 140):
            pk = lab2 == i
            if 'veil' in opt:      # the translucent sheath is close to the backdrop colour: not a hole
                pk &= (np.arange(pk.shape[1]) >= opt['veil'].get('xmax', 1) * pk.shape[1])[None, :]
            bgmask |= pk
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
    if opt.get('fill_pockets'):
        # tiny background-coloured gaps enclosed inside the subject (a gap drawn between two cells): paint them over
        import cv2
        pocket = (dist < tol) & ~bgmask
        pocket[:, :int(opt.get('fill_xmin', 0) * a.shape[1])] = False
        lab3, n3 = ndi.label(pocket, structure=np.ones((3, 3)))
        sz3 = ndi.sum(pocket, lab3, index=np.arange(1, n3 + 1))
        mind = ndi.minimum(d_to_bg, lab3, index=np.arange(1, n3 + 1))
        m = np.isin(lab3, [i for i, (s, d) in enumerate(zip(sz3, mind), 1) if 3 <= s <= opt['fill_pockets']])
        m = ndi.binary_dilation(m, iterations=2)
        if m.any():
            inp = cv2.inpaint(np.clip(rgb, 0, 255).astype(np.uint8), m.astype(np.uint8) * 255, 4, cv2.INPAINT_TELEA)
            rgb = np.where(m[..., None], inp, rgb).astype(np.float32)
            alpha = np.where(m, 1, alpha)
            print('   filled pockets:', int(m.sum()), 'px')
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
    solid = alpha > .3
    big = ndi.binary_dilation(solid, iterations=opt.get('merge', 14))
    lab, n = ndi.label(big)
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
