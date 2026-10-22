#!/usr/bin/env python3
"""Cut the unit-5 (plants) Gemini illustrations into single transparent PNGs, then remove the light fringe.

Based on the unit-3 cut.py + defringe.py (micro_ai_originals). Method: flood the flat background from the image
edge (white tolerance 9, gray tolerance 13) - NOT a whole-image threshold, so pale cells, fine roots, pale petals
and juice sacs survive. A soft 3 px ring gets alpha from the colour distance to the backdrop and the backdrop
colour is subtracted from the ring pixels. Defringe: edge pixels take the colour of the nearest solid interior
pixel, alpha is pulled in by 1 px (features thinner than the core erosion keep their colour); specks < 24 px go.
Enclosed backdrop-coloured pockets are NOT cleared by default (option 'pockets'), because the pale cells of the
stem sections look exactly like the backdrop.

Usage: cut_plants_1022.py [outdir] [job ...]   (no job = all jobs)
Originals: local-backups/20261022/plants_ai_originals/PLxx_gemini_original.jpg
Default outdir: this script's folder (assets/biology/plants_ai_1022/).
"""
import sys, os, json
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
U = ROOT + '/local-backups/20261022/plants_ai_originals/'
OUT = sys.argv[1] if len(sys.argv) > 1 else HERE
ONLY = set(sys.argv[2:])
os.makedirs(OUT, exist_ok=True)

# name, file, background, scale, subjects, options.   Subjects are left->right unless opt 'order' / 'xsplit' says otherwise.
# opt: tol, t1, ring, merge, minarea, solid, xsplit (group components by centroid x), erase [(x0,y0,x1,y1)], pockets, R (defringe radius),
#      cutlines [(x0,y0,x1,y1)] background-coloured lines drawn before labelling (manual split of touching things)
JOBS = [
    ('PL1',  'PL1_gemini_original.jpg',  'white', 1.0, ['liverwort', 'moss'], {'clear_pockets': (6, 400000), 'pocket_tol': 18, 'killwhite': (222, 1)}),
    ('PL2',  'PL2_gemini_original.jpg',  'white', 1.0, ['sword_fern', 'nest_fern'], {'clear_pockets': (4, 400000), 'pocket_tol': 22, 'killwhite': (215, 1)}),
    ('PL3',  'PL3_gemini_original.jpg',  'white', 1.0, ['pine_branch', 'pine_seed_a', 'pine_seed_b'], {'order': 'big_then_y', 't1': 40, 'clear_pockets': (3, 400000), 'pocket_tol': 28, 'clear_xmax': .8, 'killwhite': (205, .8), 'fade_rect': [(165, 650, 235, 745, 110)]}),
    ('PL4',  'PL4_gemini_original.jpg',  'white', 1.0, ['orange_whole', 'orange_half', 'orange_segment', 'orange_seeds'], {'xsplit': [700, 1450, 2050], 't1': 38, 'minarea': 300, 'clear_pockets': (30, 400000), 'pocket_tol': 14, 'clear_xmax': .31}),
    ('PL5',  'PL5_gemini_original.jpg',  'white', 1.0, ['fern_young_1', 'fern_young_2', 'fern_young_3'], {'clear_pockets': (4, 400000), 'pocket_tol': 22, 'killwhite': (212, 1)}),
    ('PL6',  'PL6_gemini_original.jpg',  'white', 1.0, ['sori_lines', 'sori_dots'], {'t1': 40, 'clear_pockets': (4, 400000), 'pocket_tol': 22, 'killwhite': (212, 1)}),
    ('PL7',  'PL7_gemini_original.jpg',  'gray',  1.0, ['sporangia', 'spores'], {'xsplit': [1200], 'minarea': 30, 'ring': 1, 'R': 1, 't1': 40, 'clear_pockets': (20, 60000), 'pocket_tol': 14, 'clear_xmax': .45}),
    ('PL8',  'PL8_gemini_original.jpg',  'white', 1.0, ['bodhi_leaf', 'bamboo_leaves'], {'t1': 40, 'clear_pockets': (6, 400000), 'pocket_tol': 18, 'killwhite': (215, 1)}),
    ('PL9',  'PL9_gemini_original.jpg',  'white', 1.0, ['stem_monocot', 'stem_dicot'], {'t1': 40}),
    ('PL10', 'PL10_gemini_original.jpg', 'white', 1.0, ['peanut_seed', 'corn_kernel'], {'t1': 38}),
    ('PL11', 'PL11_gemini_original.jpg', 'white', 1.0, ['dicot_root', 'monocot_root'], {'R': 2, 't1': 38, 'clear_pockets': (6, 400000), 'pocket_tol': 18, 'killwhite': (232, 1)}),
    ('PL12', 'PL12_gemini_original.jpg', 'white', 1.0, ['flower_3petal', 'flower_5petal'], {'t1': 36}),
    ('PL13', 'PL13_gemini_original.jpg', 'white', 1.0, ['germ_1', 'germ_2', 'germ_3', 'germ_4'], {'fade': (14, 62), 'clear_pockets': (400, 400000), 'pocket_tol': 14}),
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
    if not opt.get('pockets'):      # plants: pale cells inside the subject look like the backdrop, keep them
        tight = np.zeros_like(tight)
    lab2, n2 = ndi.label(tight, structure=np.ones((3, 3)))
    sz2 = ndi.sum(tight, lab2, index=np.arange(1, n2 + 1))
    for i, s in enumerate(sz2, 1):
        if s >= (60 if kind == 'gray' else 140):
            pk = lab2 == i
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
        pk[:, :int(opt.get('clear_xmin', 0) * a.shape[1])] = False
        if 'clear_xmax' in opt: pk[:, int(opt['clear_xmax'] * a.shape[1]):] = False
        print('   cleared tiny pockets:', int(pk.sum()), 'px')
        bgmask |= pk
    for (ex0, ey0, ex1, ey1) in opt.get('erase', []):
        # things Gemini added that do not belong to the subject (a puddle ripple under the rock)
        bgmask[ey0:ey1, ex0:ex1] = True
    if 'killwhite' in opt:
        # slivers of backdrop left between dark needles: any pixel whose weakest channel is above the threshold
        # only within 6 px of the backdrop: slits are 3-4 px wide, specular highlights deeper inside stay
        thr, xf = opt['killwhite']
        kw = (a.min(2) > thr) & (ndi.distance_transform_edt(~bgmask) <= opt.get('kwdist', 6))
        kw[:, int(xf * a.shape[1]):] = False
        bgmask |= kw
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
    for (fx0, fy0, fx1, fy1, ft1) in opt.get('fade_rect', []):
        # a painted fade into the page (the cut end of the pine twig): inside the rectangle the colour of the pale
        # pixels is taken from the nearest solid interior, alpha = how far the pixel is from the backdrop
        rect = np.zeros(dist.shape, bool); rect[fy0:fy1, fx0:fx1] = True
        core = (dist > ft1) & ~bgmask
        _, (iy, ix) = ndi.distance_transform_edt(~core, return_indices=True)
        blur = np.stack([ndi.gaussian_filter(a[..., ch], 2) for ch in range(3)], -1)
        F = blur[iy, ix]
        a2 = np.clip((dist - tol) / (ft1 - tol), 0, 1)
        zone = rect & ~bgmask
        alpha = np.where(zone, np.minimum(alpha, a2), alpha)
        keep = np.clip((a2 - .85) / .15, 0, 1)[..., None]
        rgb = np.where(zone[..., None], F * (1 - keep) + rgb * keep, rgb)
        alpha[alpha < .05] = 0
    return rgb, alpha, bg, bgmask


def order_comps(comps, how, shape):
    # comps: list of (cx, cy, x0, idx, area)
    if how == 'big_then_y':       # the branch first (largest), then the loose pieces top to bottom
        big = max(comps, key=lambda c: c[4])
        rest = sorted([c for c in comps if c is not big], key=lambda c: c[1])
        return [big] + rest
    return sorted(comps, key=lambda c: c[0])

def despeckle(a):
    lab, n = ndi.label(a > .03, structure=np.ones((3, 3)))
    if n:
        sz = ndi.sum(a > .03, lab, index=np.arange(1, n + 1))
        tiny = np.isin(lab, [i for i, s_ in enumerate(sz, 1) if s_ < 24])
        a = np.where(tiny, 0, a)
    return a

def defringe(rgba, R=3):
    im = rgba.astype(np.float32)
    rgb, a = im[..., :3], im[..., 3] / 255
    solid = a > .96
    core = ndi.binary_erosion(solid, iterations=R)
    d, (iy, ix) = ndi.distance_transform_edt(~core, return_indices=True)
    near = (d > 0) & (d <= R) & (a > 0)
    new = rgb.copy()
    new[near] = rgb[iy[near], ix[near]]
    a2 = ndi.minimum_filter(a, size=3)
    thin = ~ndi.binary_dilation(core, iterations=R + 2)
    a2 = np.where(thin, a, a2)
    a2 = np.clip(ndi.gaussian_filter(a2, .6) * 1.04, 0, 1) * (a > 0)
    a2 = despeckle(a2)
    return np.dstack([np.clip(new, 0, 255), a2 * 255]).astype(np.uint8)

report = {}
for name, f, kind, scale, subjects, opt in JOBS:
    if ONLY and name not in ONLY: continue
    im = Image.open(U + f).convert('RGB')
    a = np.asarray(im)
    rgb, alpha, bg, bgmask = cut(a, kind, opt)
    for (lx0, ly0, lx1, ly1) in opt.get('cutlines', []):
        alpha[ly0:ly1, lx0:lx1] = 0
    solid = alpha > opt.get('solid', .3)
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
    report[name] = {'bg': [int(v) for v in bg], 'size': list(im.size), 'scale': scale}
    for (cx, cy, _, i, area), sub in zip(comps, subjects):
        m = lab == i
        al = np.where(m, alpha, 0)
        ys, xs = np.nonzero(al > .02)
        x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
        pad = 4
        x0, y0 = max(0, x0 - pad), max(0, y0 - pad); x1, y1 = min(al.shape[1], x1 + pad), min(al.shape[0], y1 + pad)
        out = np.dstack([np.clip(rgb, 0, 255).astype(np.uint8), (al * 255).astype(np.uint8)])[y0:y1, x0:x1]
        out = defringe(out, opt.get('R', 3))
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
