"""M4 (hand pollination) for the Mendel unit: stamens removed from the right flower (fix_m4_stamens.py),
screenshot frame trimmed (18 px top, 8 px other sides), white background removed the same way as the other genetics pictures
(border-connected near-white is transparent, a 3.5 px band gets partial alpha with the white taken out),
then scaled to 0.5. usage: python3 cut_m4_1021.py FIXED_PNG OUT_PNG"""
import sys, json
import numpy as np
from PIL import Image
from scipy import ndimage
a = np.asarray(Image.open(sys.argv[1]).convert('RGB')).astype(np.float32)[18:-8, 8:-8]
H, W, _ = a.shape
bgc = np.array([255., 255., 255.]); TOL, BAND, HI = 7, 3.5, 60
d = np.abs(a - bgc).max(2)
lab, n = ndimage.label(d < TOL)
border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
bg = np.isin(lab, list(border))
dist = ndimage.distance_transform_edt(~bg)
alpha = np.ones((H, W), np.float32)
band = (dist < BAND) & ~bg
alpha[band] = np.clip((d[band] - TOL * .6) / (HI - TOL * .6), 0, 1)
alpha[bg] = 0
A = np.maximum(alpha, 1e-3)[..., None]
col = np.clip((a - (1 - A) * bgc) / A, 0, 255); col[alpha < .02] = 0
rgba = np.dstack([col, alpha * 255]).astype(np.uint8)
ys, xs = np.where(rgba[..., 3] > 6); pad = 6
y0, y1, x0, x1 = max(0, ys.min() - pad), min(H, ys.max() + 1 + pad), max(0, xs.min() - pad), min(W, xs.max() + 1 + pad)
im = Image.fromarray(rgba[y0:y1, x0:x1], 'RGBA'); im = im.resize((round(im.width * .5), round(im.height * .5)), Image.LANCZOS)
im.save(sys.argv[2], optimize=True)
print(json.dumps({'size': [W, H], 'crop_in_trimmed': [int(x0), int(y0), int(x1), int(y1)], 'px': [im.width, im.height]}))
