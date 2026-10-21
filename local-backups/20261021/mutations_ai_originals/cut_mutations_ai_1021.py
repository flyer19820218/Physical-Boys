"""Cut the teacher's four Gemini illustrations for the mutations unit (U1-U4) into transparent PNGs.

Background is a flat colour (grey for U1-U3, white for U4). Alpha model: the region connected to the
image border whose colour is within TOL of the background is transparent; a thin BAND next to it is
made partly transparent by colour distance (c = a*s + (1-a)*bg), and the background colour is removed
from those pixels so no grey or white rim shows on the dark board. Pure-background holes enclosed by the
subject (larger than minhole px; not for U1) are cleared as well. Subjects are separated as connected components
(small specks are attached to the nearest big one or dropped).
Screenshots (U2, U4) first lose their dark frame.\nEye crops (U2, U3) are kept at full resolution for the magnified eye comparison.
"""
import sys, json
import numpy as np
from PIL import Image
from scipy import ndimage

U = '/mnt/user-data/uploads/'
OUT = sys.argv[1]
JOBS = {
  # U1: no hole clearing (the cow's grey back highlight is close to the background grey)
  'U1': dict(src='Gemini_Generated_Image_i73j29i73j29i73j.jpeg', names=['buffalo_cow', 'buffalo_calf_albino'], scale=.55, hi=60, minhole=None),
  'U2': dict(src='1792539571407_image.png', names=['sparrow_normal', 'sparrow_albino'], scale=.8, hi=70, minhole=120, eyes=[('eye_sparrow_albino', 1121, 250, 64)]),
  'U3': dict(src='Gemini_Generated_Image_9db7vc9db7vc9db7.jpeg', names=['peacock_blue', 'peacock_white'], scale=.5, hi=70, minhole=400, eyes=[('eye_peacock_blue', 229, 217, 60), ('eye_peacock_white', 1447, 219, 60)]),
  # U4: every near-white pixel is background (cells are red; their pale seams are gaps); alpha from the green channel
  'U4': dict(src='1792539607495_image.png', names=['rbc_normal', 'rbc_sickle'], scale=.6, hi=60, minhole=1, green=True, band=4.5, tol=28, erase=[(1379, 624, 8)]),
}
TOL, BAND = 9, 3.5
log = {}
for key, job in JOBS.items():
    a = np.asarray(Image.open(U + job['src']).convert('RGB')).astype(np.float32)
    # drop a screenshot frame: keep the inner box whose rows/cols are mostly background-coloured
    H, W, _ = a.shape
    bgc = np.median(np.concatenate([a[H//2-50:H//2+50, 12:40].reshape(-1, 3), a[12:40, W//2-50:W//2+50].reshape(-1, 3)]), 0)
    near = (np.abs(a - bgc).max(2) < 6)
    rows = np.where(near.mean(1) > .2)[0]; cols = np.where(near.mean(0) > .2)[0]
    a = a[rows.min():rows.max()+1, cols.min():cols.max()+1]
    H, W, _ = a.shape
    for (ex, ey, er) in job.get('erase', []):   # a stray dot Gemini left between the cells (source coords)
        yy, xx = np.mgrid[0:H, 0:W]; a[(xx - (ex - cols.min())) ** 2 + (yy - (ey - rows.min())) ** 2 <= er * er] = bgc
    TOLJ = job.get('tol', TOL)
    d = np.abs(a - bgc).max(2)
    cand = d < TOLJ
    lab, n = ndimage.label(cand)
    border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    bg = np.isin(lab, list(border))
    # enclosed pure-background holes
    holes = np.zeros_like(bg)
    if job['minhole']:
        lab3, n3 = ndimage.label(cand & ~bg)
        if n3:
            sizes = ndimage.sum(np.ones_like(d), lab3, range(1, n3 + 1))
            holes = np.isin(lab3, [i + 1 for i, s in enumerate(sizes) if s >= job['minhole']])
            bg |= holes
    dist = ndimage.distance_transform_edt(~bg)
    alpha = np.ones((H, W), np.float32)
    band = (dist < job.get('band', BAND)) & ~bg
    if job.get('green'):
        alpha[band] = np.clip((255 - a[..., 1][band]) / 140, 0, 1)
    else:
        alpha[band] = np.clip((d[band] - TOLJ * .6) / (job['hi'] - TOLJ * .6), 0, 1)
    alpha[bg] = 0
    A = np.maximum(alpha, 1e-3)[..., None]
    col = np.clip((a - (1 - A) * bgc) / A, 0, 255)
    col[alpha < .02] = 0
    rgba = np.dstack([col, alpha * 255]).astype(np.uint8)
    # separate subjects
    solid = ndimage.binary_dilation(alpha > .05, iterations=6)
    lab2, n2 = ndimage.label(solid)
    sizes = ndimage.sum(np.ones_like(d), lab2, range(1, n2 + 1))
    order = np.argsort(sizes)[::-1]
    big = [order[0] + 1, order[1] + 1]
    cx = [ndimage.center_of_mass(lab2 == b)[1] for b in big]
    if cx[0] > cx[1]: big = big[::-1]
    # tiny specks (e.g. a stray dot) are dropped; mid-size pieces join the nearest big subject
    dist_to = [ndimage.distance_transform_edt(lab2 != b) for b in big]
    owner = np.where(dist_to[0] <= dist_to[1], 0, 1)
    keep = np.zeros_like(lab2, bool)
    dropped = []
    for i in range(1, n2 + 1):
        s = sizes[i - 1]
        if i in big or s > 3000: keep |= lab2 == i
        else: dropped.append(int(s))
    log[key] = {'source': job['src'], 'bg': bgc.round(1).tolist(), 'size': [W, H], 'holes_cleared_px': int(holes.sum()), 'dropped_specks_px': dropped, 'files': {}}
    for j, name in enumerate(job['names']):
        m = keep & (owner == j) & (alpha > 0)
        p = rgba.copy(); p[..., 3] = np.where(m, p[..., 3], 0)
        ys, xs = np.where(p[..., 3] > 6); pad = 6
        y0, y1, x0, x1 = max(0, ys.min() - pad), min(H, ys.max() + 1 + pad), max(0, xs.min() - pad), min(W, xs.max() + 1 + pad)
        im = Image.fromarray(p[y0:y1, x0:x1], 'RGBA')
        im = im.resize((round(im.width * job['scale']), round(im.height * job['scale'])), Image.LANCZOS)
        im.save(f'{OUT}/{name}.png', optimize=True)
        log[key]['files'][name] = {'px': [im.width, im.height], 'crop_in_source': [int(x0), int(y0), int(x1), int(y1)]}
    # full-resolution square crops around an eye (for the 'look at the eyes' lenses); centre in frame-cropped coords
    for (name, ex, ey, hw) in job.get('eyes', []):
        p = rgba[ey - hw:ey + hw, ex - hw:ex + hw]
        Image.fromarray(p, 'RGBA').save(f'{OUT}/{name}.png', optimize=True)
        log[key]['files'][name] = {'px': [2 * hw, 2 * hw], 'crop_in_source': [ex - hw, ey - hw, ex + hw, ey + hw]}
print(json.dumps(log, indent=1, ensure_ascii=False))
