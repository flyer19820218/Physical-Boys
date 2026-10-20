"""Cut the five H1-H5 Gemini illustrations into transparent PNG halves.

Alpha model: the pictures are subjects vignetted into a white background, so a fading pixel is
c = a*subject + (1-a)*white.  For skin, chroma (max-min) scales with a; for black hair, darkness
(255-max) scales with a.  alpha = max(chroma/Cref, darkness/Dref), applied only in the region
connected to the image border (so teeth, eye whites and skin highlights inside the face stay opaque).
Only a 70 px band next to the pure background fades; alpha is raised to the power 1.6 to avoid a pale rim.
H2 (eyes) keeps one eye with its eyebrow, the cut edge faded out.
Colour is then un-mixed from white so no pale halo shows on the dark board.
"""
import sys, json
import numpy as np
from PIL import Image
from scipy import ndimage

SRC = '/mnt/user-data/uploads/Gemini_Generated_Image_{}.jpeg'
OUT = sys.argv[1]
JOBS = {
    'H1': ('m2x6vpm2x6vpm2x6', 'lr', ['ear_free', 'ear_attached']),
    'H2': ('odynutodynutodyn', 'tb', ['eyes_double', 'eyes_single']),
    'H3': ('bqk64kbqk64kbqk6', 'lr', ['dimples_yes', 'dimples_no']),
    'H4': ('jy3u5ojy3u5ojy3u', 'lr', ['tongue_roll', 'tongue_flat']),
    'H5': ('1b49811b49811b49', 'lr', ['hairline_peak', 'hairline_straight']),
}
SCALE = 0.5
log = {}
for key, (fid, split, names) in JOBS.items():
    a = np.asarray(Image.open(SRC.format(fid)).convert('RGB')).astype(np.float32)
    H, W, _ = a.shape
    ch = a.max(2) - a.min(2)
    dk = 255 - a.max(2)
    strong = ch[ch > 25]
    cref = float(np.percentile(strong, 15))
    dref = 200.0
    est = np.clip(np.maximum(ch / cref, dk / dref), 0, 1)
    # smooth the estimate a little to calm JPEG blocks
    est_s = ndimage.uniform_filter(est, 3)
    # border-connected fade region
    cand = est_s < 0.97
    lab, n = ndimage.label(cand)
    border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    fade = np.isin(lab, list(border))
    # only a band next to the true background counts as fade (keeps pale highlights inside the face opaque)
    lab2, _ = ndimage.label(est_s < 0.08)
    b2 = set(np.unique(np.concatenate([lab2[0], lab2[-1], lab2[:, 0], lab2[:, -1]]))) - {0}
    bg = np.isin(lab2, list(b2))
    dist = ndimage.distance_transform_edt(~bg)
    fade &= dist < 70
    alpha = np.ones((H, W), np.float32)
    al = np.clip((est_s - 0.05) / 0.92, 0, 1) ** 1.6
    alpha[fade] = al[fade]
    alpha[bg] = 0
    # un-mix white
    A = np.maximum(alpha, 1e-3)[..., None]
    col = np.clip((a - (1 - A) * 255) / A, 0, 255)
    col[alpha < 0.02] = 0
    rgba = np.dstack([col, alpha * 255]).astype(np.uint8)
    # split into two halves at the widest empty gap in the middle third
    prof = (alpha > 0.04).sum(0 if split == 'lr' else 1)
    L = len(prof)
    mid = np.arange(int(L * 0.33), int(L * 0.67))
    gap = mid[prof[mid] == prof[mid].min()]
    cut = int(gap.mean())
    parts = [rgba[:, :cut], rgba[:, cut:]] if split == 'lr' else [rgba[:cut], rgba[cut:]]
    log[key] = {'source': f'Gemini_Generated_Image_{fid}.jpeg', 'Cref': round(cref, 1), 'cut': cut, 'files': {}}
    for name, p in zip(names, parts):
        m = p[..., 3] > 6
        ys, xs = np.where(m)
        y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
        pad = 8
        y0, x0 = max(0, y0 - pad), max(0, x0 - pad)
        y1, x1 = min(p.shape[0], y1 + pad), min(p.shape[1], x1 + pad)
        if key == 'H2':
            # keep one eye and its eyebrow; fade the cut edge on the right so no straight edge shows
            p = p.copy(); W2 = p.shape[1]
            xa, xb = int(W2 * 0.05), int(W2 * 0.44)
            p = p[:, xa:xb].copy(); Hh, Ww = p.shape[:2]
            # elliptical fade centred on the eye, so the cut edge melts away like the painted vignette
            yy, xx = np.mgrid[0:Hh, 0:Ww]
            d = np.sqrt(((xx - Ww * 0.40) / (Ww * 0.62)) ** 2 + ((yy - Hh * 0.5) / (Hh * 1.4)) ** 2)
            m = np.clip((1.0 - d) / 0.28, 0, 1); m = m * m * (3 - 2 * m)
            p[..., 3] = (p[..., 3] * m).astype(np.uint8)
            m = p[..., 3] > 6; ys, xs = np.where(m)
            y0, y1, x0, x1 = max(0, ys.min() - pad), min(p.shape[0], ys.max() + 1 + pad), max(0, xs.min() - pad), min(p.shape[1], xs.max() + 1 + pad)
        im = Image.fromarray(p[y0:y1, x0:x1], 'RGBA')
        im = im.resize((round(im.width * SCALE), round(im.height * SCALE)), Image.LANCZOS)
        im.save(f'{OUT}/{name}.png', optimize=True)
        log[key]['files'][name] = [im.width, im.height]
print(json.dumps(log, indent=1))
