"""Remove the stamens Gemini left in the RIGHT flower of M4 (the flower being pollinated must have had its
stamens removed). usage: python3 fix_m4_stamens.py SRC OUT
Hand-drawn polygons around the anthers and filaments (source pixel coordinates); green pistil pixels are
kept out of the mask; the masked area is filled row by row from the petal colour on both sides (the pistil is lifted out first and pasted back)."""
import sys, numpy as np, cv2
src, out = sys.argv[1], sys.argv[2]
im = cv2.imread(src)
Z = lambda pts: np.array([[1180 + x / 2, 380 + y / 2] for x, y in pts], np.int32)
polys = [Z([(200, 276), (314, 276), (322, 330), (304, 420), (254, 470), (204, 560), (166, 604), (136, 604), (146, 520), (176, 420), (200, 340)]),
         Z([(336, 286), (440, 296), (436, 362), (398, 404), (370, 426), (350, 404), (342, 340)])]
mask = np.zeros(im.shape[:2], np.uint8)
cv2.fillPoly(mask, polys, 255)
b, g, r = [im[..., i].astype(int) for i in range(3)]
# the pistil (green, plus its dark outline) is taken out, the gap is filled from the petal only, then the
# pistil is pasted back on top, so no green bleeds into the petal
x0, y0, x1, y1 = 1230, 480, 1420, 700
green = np.zeros_like(mask, bool)
green[y0:y1, x0:x1] = ((g > r + 6) & (g > b + 18))[y0:y1, x0:x1]
pistil = cv2.dilate(green.astype(np.uint8), np.ones((5, 5), np.uint8)) > 0
hole = ((mask > 0) | pistil)
hole[:y0] = False
# 1) a petal-only copy: every green pixel in the region (pistil, sepals) is replaced row by row by the
#    petal colour on either side; 2) the stamens are inpainted (Telea) on that copy, so no green bleeds in;
# 3) the original pistil is pasted back on top.
isgreen = cv2.dilate(((g > r + 6) & (g > b + 18)).astype(np.uint8), np.ones((9, 9), np.uint8)) > 0
petal = im.astype(np.float32).copy()
H, W = mask.shape
for y in range(y0, y1):
    xs = np.where(isgreen[y, x0:x1])[0] + x0
    if not len(xs): continue
    for run in np.split(xs, np.where(np.diff(xs) > 1)[0] + 1):
        xa, xb = run[0], run[-1]
        # sample the petal a few pixels outside the green, skipping dark outline and stamen pixels
        ok = lambda x: 0 <= x < W and not isgreen[y, x] and mask[y, x] == 0 and petal[y, x].mean() > 150
        lx = next((x for x in range(xa - 4, xa - 40, -1) if ok(x)), None)
        rx = next((x for x in range(xb + 4, xb + 40) if ok(x)), None)
        if lx is None and rx is None: continue
        L = petal[y, lx] if lx is not None else petal[y, rx]
        R = petal[y, rx] if rx is not None else L
        for x in run:
            u = (x - xa + 1) / (xb - xa + 2); petal[y, x] = (1 - u) * L + u * R
petal = petal.astype(np.uint8)
stam = cv2.dilate(mask, np.ones((3, 3), np.uint8))
filled = cv2.inpaint(petal, stam, 15, cv2.INPAINT_TELEA)
soft = cv2.GaussianBlur(filled, (0, 0), 2.5)
filled = np.where((stam > 0)[..., None], soft, filled)
# feather: the fill fades in over 8 px from the edge of the hole, so no hard border shows
grow = cv2.dilate(stam, np.ones((9, 9), np.uint8))
dist = cv2.distanceTransform((grow == 0).astype(np.uint8) * 0 + (grow > 0).astype(np.uint8), cv2.DIST_L2, 3)
w = np.clip(dist / 8.0, 0, 1)[..., None]
filled_g = cv2.inpaint(petal, grow, 15, cv2.INPAINT_TELEA)
filled_g = np.where((grow > 0)[..., None], cv2.GaussianBlur(filled_g, (0, 0), 2.5), filled_g)
mixd = (w * filled_g.astype(np.float32) + (1 - w) * im.astype(np.float32)).astype(np.uint8)
res = np.where(pistil[..., None], im, mixd)
cv2.imwrite(out, res)
print('masked px', int((stam > 0).sum()))
