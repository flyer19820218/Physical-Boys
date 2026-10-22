#!/usr/bin/env python3
"""Step 2 of the fungi (lesson 4) image pipeline, 2026-10-22.  Usage: refine_fungi_1022.py <raw dir> <out dir>
 - sporangia_pair.png: three thin dark slivers inside the translucent rhizoid junction (backdrop-grey pockets the cutter
   mistook for background) are filled again (inpaint colour, alpha 255). The two real lens-shaped gaps between rhizoids stay open.
Writes the refined PNGs to <out dir> (all files of <raw dir>), later passed through defringe_fungi_1022.py.
"""
import sys, os, glob, shutil
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
import cv2
RAW, OUT = sys.argv[1], sys.argv[2]
os.makedirs(OUT, exist_ok=True)
for f in glob.glob(RAW + '/*.png'):
    shutil.copy(f, OUT)
p = OUT + '/sporangia_pair.png'
im = np.array(Image.open(p).convert('RGBA'))
t = im[..., 3] < 20
lab, n = ndi.label(t)
border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]])))
fill = np.zeros(t.shape, bool); cnt = 0
for i in range(1, n + 1):
    if i in border: continue
    ys, xs = np.nonzero(lab == i)
    if 12 <= len(xs) <= 100 and ys.min() > 880:      # rhizoid junction only (the spore gaps higher up are real)
        fill |= lab == i; cnt += 1
fill = ndi.binary_dilation(fill, iterations=2)
bgr = cv2.cvtColor(im[..., :3], cv2.COLOR_RGB2BGR)
# colours under the dark sliver pixels are the (dark) transparent-pixel colours: inpaint from the opaque neighbours
known = im[..., 3] > 200
src = bgr.copy()
inp = cv2.inpaint(src, (fill * 255).astype(np.uint8), 5, cv2.INPAINT_TELEA)
im[fill, :3] = cv2.cvtColor(inp, cv2.COLOR_BGR2RGB)[fill]
im[fill, 3] = 255
Image.fromarray(im).save(p, optimize=True)
print('sporangia_pair: filled', cnt, 'slivers,', int(fill.sum()), 'px')
