#!/usr/bin/env python3
"""Step 2 of the wood-ear image pipeline (2026-10-23).  Usage: refine_woodear_1023.py <raw dir from cut_woodear_1023.py> <out dir>
The flat flood-fill matte of cut_woodear_1023.py is fine for the log with fresh wood ears (woodear_log.png, copied as is) but not for
the two other pieces, which carry a soft grey cast shadow on the white page:
  woodear_dry     : pieces = pixels that are dark or coloured (the shadow is pale and neutral grey); closed, holes filled,
                    1px feather. The pale tan highlights of the dried ears are coloured (sat > 14) and stay.
  woodear_soaked  : glass bowl. Silhouette = dark/coloured pixels closed + holes filled + opened (cuts the shadow wedge next to the base).
                    Inside the silhouette the glass is kept translucent (colour-to-alpha against white: pale glass -> low alpha, grey
                    rim lines -> mid alpha); the brown wood ears (saturated or dark) stay fully opaque. Cast shadow is outside the silhouette -> removed.
"""
import sys, os, shutil, json
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
HERE = os.path.dirname(os.path.abspath(__file__))
RAW, OUT = sys.argv[1], sys.argv[2]
os.makedirs(OUT, exist_ok=True)
o = np.asarray(Image.open(HERE + '/woodear_gemini_1023.jpg').convert('RGB')).astype(np.float32)
shutil.copy(RAW + '/woodear_log.png', OUT + '/woodear_log.png')
info = {}

def largest(m, keep_min=0):
    lab, n = ndi.label(m, structure=np.ones((3, 3)))
    sz = ndi.sum(m, lab, index=np.arange(1, n + 1))
    return np.isin(lab, [i for i, s in enumerate(sz, 1) if s >= max(keep_min, sz.max() if keep_min == 0 else 0)])

def save(name, box, rgb, alpha):
    x0, y0, x1, y1 = box
    ys, xs = np.nonzero(alpha > .02)
    a0, a1, b0, b1 = max(0, xs.min() - 4), xs.max() + 5, max(0, ys.min() - 4), ys.max() + 5
    out = np.dstack([np.clip(rgb, 0, 255), alpha * 255]).astype(np.uint8)[b0:b1, a0:a1]
    Image.fromarray(out, 'RGBA').save(f'{OUT}/{name}.png', optimize=True)
    info[name] = {'size': [int(out.shape[1]), int(out.shape[0])], 'offset_in_original': [int(x0 + a0), int(y0 + b0)]}
    print(name, info[name])

# ---- dried pile --------------------------------------------------------------------------------------------------------
# select by connected component (the pile and the bowl overlap in x, so no rectangle): pieces = dark or coloured pixels
mn_all, sat_all = o.min(2), o.max(2) - o.min(2)
obj = (mn_all < 170) | (sat_all > 24)     # the cast shadow is pale and slightly warm: sat stays below ~22
cl = ndi.binary_closing(obj, structure=np.ones((3, 3)), iterations=2)
labm, nm = ndi.label(ndi.binary_dilation(cl, iterations=14))
pile = labm == labm[894, 1573]
m = pile & cl
# fill enclosed pockets only when small (gaps between curls that Gemini painted pale stay open, they are shadow/page)
holes = ndi.binary_fill_holes(m) & ~m
lh, nh = ndi.label(holes)
szh = ndi.sum(holes, lh, index=np.arange(1, nh + 1))
m = m | np.isin(lh, [k for k, v in enumerate(szh, 1) if v <= 60])
ys, xs = np.nonzero(m)
box = (xs.min() - 6, ys.min() - 6, xs.max() + 7, ys.max() + 7)
c = o[box[1]:box[3], box[0]:box[2]]
mm = m[box[1]:box[3], box[0]:box[2]]
alpha = np.clip(ndi.gaussian_filter(mm.astype(np.float32), 0.8) * 1.15, 0, 1) * ndi.binary_dilation(mm, iterations=2)
save('woodear_dry', box, c, alpha)

# ---- bowl with soaked wood ear -----------------------------------------------------------------------------------------
box = (1760, 500, 2460, 1070)
c = o[box[1]:box[3], box[0]:box[2]]
mn, sat = c.min(2), c.max(2) - c.min(2)
# upper part of the bowl: threshold 200 keeps the pale rim; lower part (below the waist) threshold 165 so the cast shadow below the base,
# which grows pale gradually (116 at the base line -> 252 page white), is left out
# the threshold slides from 200 to 150 between crop rows 430 and 470, i.e. only around the base (the pale glass wall above is ~170-200
# and must stay; the cast shadow only starts under the base line at row ~480-490)
T = 200 - 50 * np.clip((np.arange(mn.shape[0])[:, None] - 430) / 40, 0, 1)
m = (mn < T) | (sat > 30)
m = ndi.binary_closing(m, structure=np.ones((3, 3)), iterations=6)
m = ndi.binary_fill_holes(m)
m = largest(m)
m = ndi.binary_opening(m, structure=np.ones((3, 3)), iterations=18)  # shadow wedge beside the base is a thin protrusion
m = largest(ndi.binary_fill_holes(m))
m = ndi.binary_erosion(m, iterations=2)
a_glass = np.clip((255 - mn) / 255 * 2.3, 0, 1)
w_sat = np.clip((sat - 18) / 45, 0, 1)
w_dark = np.clip((150 - mn) / 60, 0, 1)
a = np.maximum(a_glass, np.maximum(w_sat, w_dark))
edge = np.clip(ndi.distance_transform_edt(m) / 2.0, 0, 1)             # 2px feather inside the silhouette edge
alpha = a * edge * m
# below the base line (crop row ~450+) anything paler than the base line (116-135) is cast shadow: fade it out
fade = np.where(np.arange(mn.shape[0])[:, None] > 450, np.clip((190 - mn) / 50, 0, 1), 1)
alpha = alpha * fade
rgb = c.copy()
k = alpha > .03
for ch in range(3):                                                    # colour-to-alpha: remove the white page from translucent pixels
    rgb[..., ch] = np.where(k, (c[..., ch] - 255 * (1 - a)) / np.maximum(a, .05), c[..., ch])
save('woodear_soaked', box, np.clip(rgb, 0, 255), alpha)
json.dump(info, open(OUT + '/_info.json', 'w'), indent=1)
