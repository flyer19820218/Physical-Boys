#!/usr/bin/env python3
"""Checks every PNG of assets/biology/fungi_ai_1022: real transparency (alpha channel, fully clear background, no semi-opaque
backdrop colour), and no light/grey fringe along the edge. Usage: verify_fungi_1022.py <dir>"""
import sys, glob, os, json
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
D = sys.argv[1]
BACK = {'hyphae_a': (132,) * 3, 'hyphae_b': (132,) * 3, 'bread_mold': (133,) * 3, 'sporangia_pair': (133,) * 3, 'sporangium_closed': (133,) * 3,
        'sporangium_open': (133,) * 3, 'mushroom_soil': (255, 255, 254), 'mushroom_cap_only': (255, 255, 254), 'mycelium_net_only': (255, 255, 254),
        'orange_mold': (255, 255, 254), 'penicillium_brush': (255, 255, 254)}
rows = []
for f in sorted(glob.glob(D + '/*.png')):
    n = os.path.basename(f)[:-4]
    im = Image.open(f)
    assert im.mode == 'RGBA', (n, im.mode)
    a = np.asarray(im).astype(float); rgb = a[..., :3]; al = a[..., 3] / 255
    clear = (al == 0).mean(); mid = ((al > 0) & (al < .96)).mean()
    border_clear = np.concatenate([al[0], al[-1], al[:, 0], al[:, -1]]).mean()
    solid = al > .96
    core = ndi.binary_erosion(solid, iterations=3)
    _, (iy, ix) = ndi.distance_transform_edt(~core, return_indices=True)
    d_to_clear = ndi.distance_transform_edt(al > 0)
    ring = (al >= .2) & (d_to_clear <= 3) & ~core
    ref = rgb[iy, ix]
    diff = np.sqrt(((rgb - ref) ** 2).sum(2))
    bgc = np.array(BACK[n], float)
    nearbg = np.sqrt(((rgb - bgc) ** 2).sum(2)) < 22
    refnearbg = np.sqrt(((ref - bgc) ** 2).sum(2)) < 40
    fringe = ring & nearbg & ~refnearbg
    lum = rgb @ np.array([.299, .587, .114])
    bright = ring & (lum - (ref @ np.array([.299, .587, .114])) > 30)
    rows.append((n, im.size, round(clear, 3), round(mid, 4), round(border_clear, 3), int(ring.sum()), int(fringe.sum()), int(bright.sum()), round(float(np.percentile(diff[ring], 95)), 1) if ring.any() else 0))
print('name size clear_frac semi_frac border_clear ring_px backdrop_fringe_px brighter_than_inside_px diff95')
for r in rows: print(*r)
