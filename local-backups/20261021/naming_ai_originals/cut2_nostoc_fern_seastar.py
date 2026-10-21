#!/usr/bin/env python3
"""Cut the unit-2 Gemini illustrations into single transparent PNGs.

Method (same idea as the earlier genetics units): flood the flat background from the image edge,
also remove enclosed bg-coloured pockets (lace of the stinkhorn, gaps inside curled tails),
then blend a 3 px ring: alpha from the colour distance to the background, and subtract the
background colour from those ring pixels so no halo shows on the dark board.
"""
import sys, os, json
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

U = '/mnt/user-data/uploads/'
A = '/mnt/user-data/attachments/b69b9464-a76b-5abd-b339-1b0b55ccad7d/'
OUT = sys.argv[1]
os.makedirs(OUT, exist_ok=True)

# name, file, background, crop(left,top,right,bottom) or None, scale, subjects left->right
JOBS = [
    ('seastar', A + '6fcd33dc-image.jpg', 'white', None, .5, ['seastar_top', 'seastar_bottom']),
    ('ferns',   A + 'a7603978-image.jpg', 'white', None, .5, ['fern_sword', 'fern_nest']),
    ('nostoc',  A + '4afa6498-image.jpg', 'gray',  None, .5, ['nostoc_dry', 'nostoc_wet']),
]

def bg_color(a, kind):
    h, w = a.shape[:2]
    ring = np.concatenate([a[:6].reshape(-1, 3), a[-6:].reshape(-1, 3), a[:, :6].reshape(-1, 3), a[:, -6:].reshape(-1, 3)])
    return np.median(ring, axis=0)

def cut(a, kind):
    a = a.astype(np.float32)
    bg = bg_color(a, kind)
    dist = np.sqrt(((a - bg) ** 2).sum(2))
    tol = OVR[0] if OVR else (13 if kind == 'gray' else 9)
    near = dist < tol
    lab, n = ndi.label(near, structure=np.ones((3, 3)))
    border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    sizes = ndi.sum(near, lab, index=np.arange(1, n + 1))
    bgmask = np.isin(lab, list(border))
    # enclosed pockets of exactly-background colour (lace holes, gaps inside curled tails)
    tight = dist < (OVR[1] if OVR else (7 if kind == 'gray' else 5))
    lab2, n2 = ndi.label(tight, structure=np.ones((3, 3)))
    sz2 = ndi.sum(tight, lab2, index=np.arange(1, n2 + 1))
    for i, s in enumerate(sz2, 1):
        if s >= (OVR[2] if OVR else (60 if kind == 'gray' else 140)):
            bgmask |= lab2 == i
    # soft ring
    d_to_bg = ndi.distance_transform_edt(~bgmask)
    ring = (d_to_bg > 0) & (d_to_bg <= 3)
    t1 = OVR[3] if OVR else (70 if kind == 'gray' else 55)
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
    return rgb, alpha, bg

report = {}
OVR = None
OVERRIDES = {'ferns': (34, 24, 30, 75), 'nostoc': (24, 14, 60, 80)}
for name, f, kind, crop, scale, subjects in JOBS:
    im = Image.open(f).convert('RGB')
    if crop: im = im.crop(crop)
    a = np.asarray(im)
    if name == 'nostoc':
        import cv2
        a = a.copy()
        bgc = np.median(np.concatenate([a[:6].reshape(-1, 3), a[-6:].reshape(-1, 3)]), axis=0)
        dist = np.sqrt(((a.astype(np.float32) - bgc) ** 2).sum(2))
        near = dist < 13
        lab, n = ndi.label(near, structure=np.ones((3, 3)))
        border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
        fg = ~np.isin(lab, list(border))
        flab, fn = ndi.label(fg, structure=np.ones((3, 3)))
        fsz = ndi.sum(fg, flab, index=np.arange(1, fn + 1))
        subj = np.isin(flab, [i for i, z in enumerate(fsz, 1) if z >= 20000])
        interior = ndi.binary_erosion(subj, iterations=25)
        white = a.min(2) >= 226
        wl, wn = ndi.label(white, structure=np.ones((3, 3)))
        kill = np.zeros(white.shape, bool)
        for i, sl in enumerate(ndi.find_objects(wl), 1):
            h, w = sl[0].stop - sl[0].start, sl[1].stop - sl[1].start
            m = wl[sl] == i
            inside = interior[sl][m].all()
            if max(h, w) >= 45 or not inside:
                kill[sl] |= m
        # whole-image: also kill every non-subject island (text, signature) and small fg bits
        kill |= fg & ~subj
        kill = ndi.binary_dilation(kill, iterations=3)
        print('nostoc cleaned px', int(kill.sum()))
        a = cv2.inpaint(np.ascontiguousarray(a), kill.astype(np.uint8) * 255, 5, cv2.INPAINT_TELEA)
    OVR = OVERRIDES.get(name)
    rgb, alpha, bg = cut(a, kind)
    # one connected piece per subject
    solid = alpha > .3
    big = ndi.binary_dilation(solid, iterations=14)
    lab, n = ndi.label(big)
    comps = []
    for i in range(1, n + 1):
        m = lab == i
        area = int((solid & m).sum())
        if area < 4000: continue
        ys, xs = np.nonzero(m & solid)
        comps.append((xs.min(), i, area))
    comps.sort()
    assert len(comps) == len(subjects), (name, [(c[0], c[2]) for c in comps], n)
    report[name] = {'bg': [int(v) for v in bg], 'size': im.size, 'scale': scale}
    for (_, i, area), sub in zip(comps, subjects):
        m = lab == i
        al = np.where(m, alpha, 0)
        ys, xs = np.nonzero(al > .02)
        x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
        pad = 4
        x0, y0 = max(0, x0 - pad), max(0, y0 - pad); x1, y1 = min(al.shape[1], x1 + pad), min(al.shape[0], y1 + pad)
        out = np.dstack([np.clip(rgb, 0, 255).astype(np.uint8), (al * 255).astype(np.uint8)])[y0:y1, x0:x1]
        img = Image.fromarray(out, 'RGBA')
        w, h = img.size
        img = img.resize((round(w * scale), round(h * scale)), Image.LANCZOS)
        img.save(f'{OUT}/{sub}.png', optimize=True)
        report[name][sub] = list(img.size)
        print(name, sub, img.size, 'area', area)
json.dump(report, open(OUT + '/_report.json', 'w'), ensure_ascii=False, indent=1)
