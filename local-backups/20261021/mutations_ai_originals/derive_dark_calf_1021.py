"""Derive a normally pigmented (dark slate) calf from the albino calf cut-out, for the Aa x Aa family model.
Same outline and pose, only the colours change: luminance is kept as shading and mapped onto the grey-black
range of the buffalo cow in the same Gemini picture; the lower legs keep a pale 'stocking' like the cow's.
Eyes are already dark and stay as they are (pixels darker than the outline threshold are kept)."""
import sys
import numpy as np
from PIL import Image
src, out = sys.argv[1], sys.argv[2]
im = np.asarray(Image.open(src).convert('RGBA')).astype(np.float32)
rgb, a = im[..., :3], im[..., 3:]
H, W = a.shape[:2]
L = rgb @ np.array([.299, .587, .114])
# shading 0..1 from the calf's own range
lo, hi = np.percentile(L[a[..., 0] > 200], [3, 97])
u = np.clip((L - lo) / (hi - lo), 0, 1)[..., None]
dark = np.array([38, 42, 48.]); light = np.array([112, 117, 125.])
body = dark + (light - dark) * u ** 1.15
# pale stockings on the lower legs (as on the cow), faded in between 74% and 82% of the height
yy = np.mgrid[0:H, 0:W][0][..., None] / H
st = np.clip((yy - .74) / .08, 0, 1) * .75
cream = np.array([150, 146, 132.]) + np.array([70, 68, 60.]) * u
col = body * (1 - st) + cream * st
keep = (L < 70)[..., None]           # outline and eye stay as drawn
col = np.where(keep, rgb, col)
Image.fromarray(np.dstack([np.clip(col, 0, 255), a]).astype(np.uint8), 'RGBA').save(out, optimize=True)
