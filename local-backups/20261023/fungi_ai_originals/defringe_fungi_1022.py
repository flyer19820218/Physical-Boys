#!/usr/bin/env python3
"""Remove the light fringe left from the white/gray Gemini backgrounds (unit 3, microorganisms).
Same method as the unit-2 defringe.py (naming_ai_originals): edge pixels (within R px of the transparent area)
take the colour of the nearest solid interior pixel; alpha is pulled in by 1 px. Features thinner than the core
erosion (cilia, fine roots, antennae) keep their original colour.
Extra in this version: isolated specks smaller than 24 px (JPEG noise outside the subject) are removed at the end
(cilia pieces are > 50 px and stay).

Usage: defringe.py SRC DST [R] [file.png=R | file.png=skip ...]
  R            default radius, 3
  file.png=2   use radius 2 for that file (kelp: finer holdfast roots)
  file.png=skip  no defringe for that file (translucent jelly sheath of the nostoc), despeckle only
"""
import sys, os, glob
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
SRC, DST = sys.argv[1], sys.argv[2]
os.makedirs(DST, exist_ok=True)
R0 = int(sys.argv[3]) if len(sys.argv) > 3 else 3
OVER = {}
for arg in sys.argv[4:]:
    k, v = arg.split('=')
    OVER[k] = v

def despeckle(a, rgb_arr):
    lab, n = ndi.label(a > .03, structure=np.ones((3, 3)))
    if n:
        sz = ndi.sum(a > .03, lab, index=np.arange(1, n + 1))
        tiny = np.isin(lab, [i for i, s_ in enumerate(sz, 1) if s_ < 24])
        a = np.where(tiny, 0, a)
    return a

for f in sorted(glob.glob(SRC + '/*.png')):
    name = os.path.basename(f)
    im = np.asarray(Image.open(f).convert('RGBA')).astype(np.float32)
    rgb, a = im[..., :3], im[..., 3] / 255
    mode = OVER.get(name, str(R0))
    if mode == 'skip':
        out = np.dstack([rgb, despeckle(a, rgb) * 255]).astype(np.uint8)
        Image.fromarray(out, 'RGBA').save(DST + '/' + name, optimize=True)
        print('skip', name); continue
    R = int(mode)
    solid = a > .96
    core = ndi.binary_erosion(solid, iterations=R)
    d, (iy, ix) = ndi.distance_transform_edt(~core, return_indices=True)
    near = (d > 0) & (d <= R) & (a > 0)
    new = rgb.copy()
    new[near] = rgb[iy[near], ix[near]]
    # pull alpha in by ~1px: opacity of a pixel = min over its 3x3 neighbourhood, then blend with a little blur
    a2 = ndi.minimum_filter(a, size=3)
    thin = ~ndi.binary_dilation(core, iterations=R + 2)   # fine details far from any core stay as they were
    a2 = np.where(thin, a, a2)
    a2 = np.clip(ndi.gaussian_filter(a2, .6) * 1.04, 0, 1) * (a > 0)
    a2 = despeckle(a2, new)
    out = np.dstack([np.clip(new, 0, 255), a2 * 255]).astype(np.uint8)
    Image.fromarray(out, 'RGBA').save(DST + '/' + name, optimize=True)
print('ok')
