#!/usr/bin/env python3
"""Step 4 of the fungi (lesson 4) image pipeline, 2026-10-22.  Usage: finish_fungi_1022.py <defringed dir> <final dir>
  - copies the defringed PNGs to the final folder
  - sporangium_closed.png / sporangium_open.png: the two sphere+stalk halves of sporangia_pair.png (cut across the stalks at
    y = 835 of the pair; they sit on the pair at the offsets printed below, the rhizoid base stays in the pair)
  - mushroom_cap_only.png / mycelium_net_only.png: layers_soil_1022.py (same canvas as mushroom_soil.png)
Also writes sizes.json (every PNG's pixel size) and pieces.json (offsets).
"""
import sys, os, glob, shutil, json, subprocess
import numpy as np
from PIL import Image
SRC, OUT = sys.argv[1], sys.argv[2]
os.makedirs(OUT, exist_ok=True)
for f in glob.glob(SRC + '/*.png'):
    shutil.copy(f, OUT)
pieces = {}
pair = np.array(Image.open(OUT + '/sporangia_pair.png').convert('RGBA'))
H, W = pair.shape[:2]
X = np.arange(W)[None, :].repeat(H, 0); Y = np.arange(H)[:, None].repeat(W, 1)
XS, YC = 541, 835     # midline between the two stalks (measured), cut line across the stalks
for name, keep in [('sporangium_closed', (X < XS) & (Y < YC)), ('sporangium_open', (X >= XS) & (Y < YC))]:
    a = pair.copy(); a[~keep, 3] = 0
    ys, xs = np.nonzero(a[..., 3] > 0)
    x0, y0, x1, y1 = xs.min(), ys.min(), xs.max() + 1, ys.max() + 1
    Image.fromarray(a[y0:y1, x0:x1]).save(f'{OUT}/{name}.png', optimize=True)
    pieces[name] = {'offset_in_pair': [int(x0), int(y0)], 'size': [int(x1 - x0), int(y1 - y0)]}
subprocess.check_call([sys.executable, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'layers_soil_1022.py'), OUT])
sizes = {os.path.basename(f): list(Image.open(f).size) for f in sorted(glob.glob(OUT + '/*.png'))}
json.dump(sizes, open(OUT + '/sizes.json', 'w'), indent=1)
json.dump(pieces, open(OUT + '/pieces.json', 'w'), indent=1)
print(json.dumps(sizes)); print(json.dumps(pieces))
