#!/usr/bin/env python3
"""Remove the light fringe left from the white/gray Gemini backgrounds.
Edge pixels (within R px of the transparent area) take the colour of the nearest solid interior pixel;
alpha is pulled in by 1 px. Features thinner than the core erosion (legs, antennae, wing membranes) keep their original colour."""
import sys, os, glob
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
SRC, DST = sys.argv[1], sys.argv[2]
os.makedirs(DST, exist_ok=True)
R = 3
for f in sorted(glob.glob(SRC + '/*.png')):
    im = np.asarray(Image.open(f).convert('RGBA')).astype(np.float32)
    rgb, a = im[..., :3], im[..., 3] / 255
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
    out = np.dstack([np.clip(new, 0, 255), a2 * 255]).astype(np.uint8)
    Image.fromarray(out, 'RGBA').save(DST + '/' + os.path.basename(f), optimize=True)
print('ok')
