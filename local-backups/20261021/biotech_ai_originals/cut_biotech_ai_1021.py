"""Cut the teacher's six Gemini illustrations for the biotechnology unit (B1-B6) into separate pictures.

usage: python3 cut_biotech_ai_1021.py SRC_DIR OUT_DIR

Backgrounds are flat (grey for B1, B2, B4; white for B3, B5; black for B6). B2-B6 are screenshots: a few
pixels of frame are trimmed first.
- 'flood' (B2-B5): the region connected to the image border whose colour is within TOL of the background is
  transparent; a thin BAND next to it gets partial alpha by colour distance, and the background colour is
  removed from those pixels (c = a*s + (1-a)*bg) so no grey or white rim shows on the dark board. Pure
  background holes enclosed by the subject (>= minhole px) are cleared too.
- 'glass' boxes (B3): the empty glass of the soy-sauce bottle gets difference matting too, so it is see-through.
- 'diff' (B1): glass bowls let the grey background show through, so alpha comes from the colour distance to
  the background everywhere (difference matting); clear glass becomes see-through, the rim and highlights stay.
- 'screen' (B6): glowing fish on black. Not cut: each fish is cropped with its black margin and the page draws
  it with the 'screen' blend, so black disappears and the glow stays as painted.
Subjects are separated as connected components and sorted left to right (or by the given order).
"""
import sys, json
import numpy as np
from PIL import Image
from scipy import ndimage

SRC, OUT = sys.argv[1], sys.argv[2]
JOBS = {
  'B1': dict(src='B1_dough_bread.jpg', method='diff', names=['dough_bowl', 'dough_risen', 'bread_loaf'], scale=.5, t0=7, t1=46, frame=0),
  'B2': dict(src='B2_yeast_screenshot.png', method='flood', names=['yeast_cells'], whole=True, scale=.6, hi=70, minhole=60, frame=8),
  'B3': dict(src='B3_fermented_foods_screenshot.png', method='flood', names=['food_soy_sauce', 'food_yogurt', 'food_pickled_cabbage', 'food_bread'], scale=.6, hi=60, minhole=None, frame=8, tol=7,
             glass=[(100, 262, 300, 404, 34)]),  # empty glass of the soy-sauce bottle (source coords): see-through
  'B4': dict(src='B4_sheep_screenshot.png', method='flood', names=['sheep_white_face', 'sheep_black_face_egg', 'sheep_black_face_surrogate', 'lamb_dolly'], scale=.55, hi=70, minhole=150, frame=8),
  'B5': dict(src='B5_brassica_screenshot.png', method='flood', names=['brassica_wild', 'brassica_cabbage', 'brassica_broccoli', 'brassica_cauliflower', 'brassica_kohlrabi', 'brassica_kale'], scale=.6, hi=60, minhole=3, frame=8, tol=10, dil=2),
  'B6': dict(src='B6_zebrafish_screenshot.png', method='screen', frame=8,
             boxes={'fish_green': (30, 120, 880, 400), 'fish_red': (920, 120, 1770, 400), 'fish_green_unlit': (30, 600, 880, 880), 'fish_plain': (920, 600, 1770, 880)}, scale=.5),
}
TOL, BAND = 9, 3.5
log = {}

def save(arr, name, scale, mode='RGBA'):
    im = Image.fromarray(arr, mode)
    im = im.resize((round(im.width * scale), round(im.height * scale)), Image.LANCZOS)
    im.save(f'{OUT}/{name}.png', optimize=True)
    return [im.width, im.height]

for key, job in JOBS.items():
    a = np.asarray(Image.open(f"{SRC}/{job['src']}").convert('RGB')).astype(np.float32)
    f = job['frame']
    if f: a = a[f:-f, f:-f]
    H, W, _ = a.shape
    entry = {'source': job['src'], 'method': job['method'], 'frame_trimmed_px': f, 'files': {}}
    if job['method'] == 'screen':
        for name, (x0, y0, x1, y1) in job['boxes'].items():
            p = np.clip(a[y0:y1, x0:x1], 0, 255).astype(np.uint8)
            entry['files'][name] = {'px': save(p, name, job['scale'], 'RGB'), 'crop_in_source': [x0 + f, y0 + f, x1 + f, y1 + f]}
        log[key] = entry
        continue
    bgc = np.median(np.concatenate([a[H//2-60:H//2+60, 4:30].reshape(-1, 3), a[4:30, W//2-60:W//2+60].reshape(-1, 3),
                                    a[-30:-4, W//2-60:W//2+60].reshape(-1, 3), a[H//2-60:H//2+60, -30:-4].reshape(-1, 3)]), 0)
    d = np.abs(a - bgc).max(2)
    if job['method'] == 'diff':
        alpha = np.clip((d - job['t0']) / (job['t1'] - job['t0']), 0, 1)
        lab, n = ndimage.label(d < job['t0'] + 3)
        border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
        bg = np.isin(lab, list(border)); alpha[bg] = 0
        holes = np.zeros_like(bg)
    else:
        tol = job.get('tol', TOL)
        cand = d < tol
        lab, n = ndimage.label(cand)
        border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
        bg = np.isin(lab, list(border))
        holes = np.zeros_like(bg)
        if job['minhole']:
            lab3, n3 = ndimage.label(cand & ~bg)
            if n3:
                sizes = ndimage.sum(np.ones_like(d), lab3, range(1, n3 + 1))
                holes = np.isin(lab3, [i + 1 for i, s in enumerate(sizes) if s >= job['minhole']])
                bg |= holes
        dist = ndimage.distance_transform_edt(~bg)
        alpha = np.ones((H, W), np.float32)
        band = (dist < BAND) & ~bg
        alpha[band] = np.clip((d[band] - tol * .6) / (job['hi'] - tol * .6), 0, 1)
        alpha[bg] = 0
    for (gx0, gy0, gx1, gy1, gt) in job.get('glass', []):
        sl = (slice(gy0 - f, gy1 - f), slice(gx0 - f, gx1 - f))
        g = alpha[sl] > 0
        alpha[sl] = np.where(g, np.minimum(alpha[sl], np.clip((d[sl] - 3) / gt, 0, 1)), alpha[sl])
    A = np.maximum(alpha, 1e-3)[..., None]
    col = np.clip((a - (1 - A) * bgc) / A, 0, 255)
    col[alpha < .02] = 0
    rgba = np.dstack([col, alpha * 255]).astype(np.uint8)
    entry.update({'bg': bgc.round(1).tolist(), 'size': [W, H], 'holes_cleared_px': int(holes.sum())})
    if job.get('whole'):
        ys, xs = np.where(rgba[..., 3] > 6); pad = 6
        y0, y1, x0, x1 = max(0, ys.min() - pad), min(H, ys.max() + 1 + pad), max(0, xs.min() - pad), min(W, xs.max() + 1 + pad)
        entry['files'][job['names'][0]] = {'px': save(rgba[y0:y1, x0:x1], job['names'][0], job['scale']), 'crop_in_source': [int(x0 + f), int(y0 + f), int(x1 + f), int(y1 + f)]}
        log[key] = entry
        continue
    k = len(job['names'])
    solid = ndimage.binary_dilation(alpha > .08, iterations=job.get('dil', 6))
    lab2, n2 = ndimage.label(solid)
    sizes = ndimage.sum(np.ones_like(d), lab2, range(1, n2 + 1))
    order = np.argsort(sizes)[::-1]
    big = [int(order[i] + 1) for i in range(k)]
    big.sort(key=lambda b: ndimage.center_of_mass(lab2 == b)[1])
    dist_to = np.stack([ndimage.distance_transform_edt(lab2 != b) for b in big])
    owner = np.argmin(dist_to, 0)
    keep = np.zeros_like(lab2, bool); dropped = []
    for i in range(1, n2 + 1):
        if i in big or sizes[i - 1] > 2500: keep |= lab2 == i
        else: dropped.append(int(sizes[i - 1]))
    entry['dropped_specks_px'] = dropped
    entry['component_sizes'] = [int(sizes[b - 1]) for b in big]
    for j, name in enumerate(job['names']):
        m = keep & (owner == j) & (alpha > 0)
        p = rgba.copy(); p[..., 3] = np.where(m, p[..., 3], 0)
        ys, xs = np.where(p[..., 3] > 6); pad = 6
        y0, y1, x0, x1 = max(0, ys.min() - pad), min(H, ys.max() + 1 + pad), max(0, xs.min() - pad), min(W, xs.max() + 1 + pad)
        entry['files'][name] = {'px': save(p[y0:y1, x0:x1], name, job['scale']), 'crop_in_source': [int(x0 + f), int(y0 + f), int(x1 + f), int(y1 + f)]}
    log[key] = entry
print(json.dumps(log, indent=1, ensure_ascii=False))

# Single yeast cells for the zoom animations: separate components of yeast_cells.png (connected cell groups
# stay together), named by position. Same pixels, no rescaling.
im = np.asarray(Image.open(f'{OUT}/yeast_cells.png'))
lab, n = ndimage.label(ndimage.binary_dilation(im[..., 3] > 20, iterations=1))
PICK = {'yeast_budding': (489, 125), 'yeast_single': (290, 212), 'yeast_small': (171, 302), 'yeast_pair': (419, 394), 'yeast_tall': (206, 118)}
for name, (x, y) in PICK.items():
    m = lab == lab[y, x]
    p = im.copy(); p[..., 3] = np.where(m, p[..., 3], 0)
    ys, xs = np.where(p[..., 3] > 6); pad = 4
    y0, y1, x0, x1 = max(0, ys.min() - pad), ys.max() + 1 + pad, max(0, xs.min() - pad), xs.max() + 1 + pad
    Image.fromarray(p[y0:y1, x0:x1], 'RGBA').save(f'{OUT}/{name}.png', optimize=True)
    log['B2']['files'][name] = {'px': [int(x1 - x0), int(y1 - y0)], 'crop_in_yeast_cells_png': [int(x0), int(y0), int(x1), int(y1)]}
print(json.dumps({k: v['files'] for k, v in log.items() if k == 'B2'}, ensure_ascii=False))
