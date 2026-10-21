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
    ('cat_horse',  U + 'Gemini_Generated_Image_k3k14bk3k14bk3k1.jpeg', 'white', None, .5, ['cat_tabby', 'horse_bay']),
    ('wolf_coyote', U + 'Gemini_Generated_Image_54ex0g54ex0g54ex.jpeg', 'white', None, .5, ['wolf', 'coyote']),
    ('martens',    U + 'Gemini_Generated_Image_epngq3epngq3epng.jpeg', 'white', None, .5, ['marten_yellow_throated', 'marten_american']),
    ('serow_beetle', U + 'Gemini_Generated_Image_vnif7vvnif7vvnif.jpeg', 'gray', None, .5, ['serow', 'longhorn_beetle']),
    ('algae_fungus', U + 'Gemini_Generated_Image_w596frw596frw596.jpeg', 'gray', None, .5, ['sea_lettuce', 'stinkhorn']),
    ('insects',    U + 'Gemini_Generated_Image_dp7zkzdp7zkzdp7z.jpeg', 'gray', None, .5, ['dragonfly', 'fly', 'silverfish']),
    ('dogs',       A + '46499959-image.png', 'white', (10, 10, 1798, 1004), .7, ['dog_chihuahua', 'dog_great_dane']),
    ('arthropods', A + '971b7eb9-image.png', 'white', (10, 10, 1798, 1004), .7, ['spider', 'crab', 'snail']),
    ('cats',       A + 'b5b9919a-image.png', 'white', (12, 12, 1798, 1000), .7, ['cat_longhair', 'cat_shorthair']),
]

def bg_color(a, kind):
    h, w = a.shape[:2]
    ring = np.concatenate([a[:6].reshape(-1, 3), a[-6:].reshape(-1, 3), a[:, :6].reshape(-1, 3), a[:, -6:].reshape(-1, 3)])
    return np.median(ring, axis=0)

def cut(a, kind):
    a = a.astype(np.float32)
    bg = bg_color(a, kind)
    dist = np.sqrt(((a - bg) ** 2).sum(2))
    tol = 13 if kind == 'gray' else 9
    near = dist < tol
    lab, n = ndi.label(near, structure=np.ones((3, 3)))
    border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    sizes = ndi.sum(near, lab, index=np.arange(1, n + 1))
    bgmask = np.isin(lab, list(border))
    # enclosed pockets of exactly-background colour (lace holes, gaps inside curled tails)
    tight = dist < (7 if kind == 'gray' else 5)
    lab2, n2 = ndi.label(tight, structure=np.ones((3, 3)))
    sz2 = ndi.sum(tight, lab2, index=np.arange(1, n2 + 1))
    for i, s in enumerate(sz2, 1):
        if s >= (60 if kind == 'gray' else 140):
            bgmask |= lab2 == i
    # soft ring
    d_to_bg = ndi.distance_transform_edt(~bgmask)
    ring = (d_to_bg > 0) & (d_to_bg <= 3)
    t1 = 70 if kind == 'gray' else 55
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
for name, f, kind, crop, scale, subjects in JOBS:
    im = Image.open(f).convert('RGB')
    if crop: im = im.crop(crop)
    a = np.asarray(im)
    if name == 'cats':
        # stray red dot between the two cats (Gemini artefact): paint it with the surrounding white
        a = a.copy()
        a[550:570, 984:1006] = np.median(a[540:580, 960:1030].reshape(-1, 3), axis=0)
        a = a.copy()
        m = (a[..., 0].astype(int) - np.maximum(a[..., 1], a[..., 2]).astype(int)) > 40
        ys, xs = np.nonzero(m[500:620, 940:1060]);
        for y, x in zip(ys + 500, xs + 940): a[y, x] = 255
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
