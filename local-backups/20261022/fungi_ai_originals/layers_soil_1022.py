#!/usr/bin/env python3
"""Split mushroom_soil.png (FU4) into two same-size layers, 2026-10-22.
  mushroom_cap_only.png   : only the mushrooms standing on / lying on the ground (soil, mycelium removed)
  mycelium_net_only.png   : the soil block with its mycelium network, mushrooms removed (soil behind the stem bases is inpainted)
Both layers keep the canvas of mushroom_soil.png (1226x1302), so stacking them gives the original picture.
Usage: layers_soil_1022.py <dir with mushroom_soil.png> [debug_dir]
"""
import sys, json
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as ndi
D = sys.argv[1]; DBG = sys.argv[2] if len(sys.argv) > 2 else None
im = np.array(Image.open(D + '/mushroom_soil.png').convert('RGBA'))
H, W = im.shape[:2]
rgb = im[..., :3].astype(float); al = im[..., 3]
lum = rgb @ np.array([.299, .587, .114]); rb = rgb[..., 0] - rgb[..., 2]
Y = np.arange(H)[:, None].repeat(W, 1)
def disk(r):
    yy, xx = np.mgrid[-r:r + 1, -r:r + 1]; return (xx ** 2 + yy ** 2) <= r * r

# 1) mushroom pixels: cream / bright, or saturated brown; only above the line where the stems meet the soil
M0 = (al > 0) & ((rb >= 50) | (lum >= 150)) & (Y <= 548)
M1 = ndi.binary_opening(M0, structure=disk(5))
lab, n = ndi.label(M1)
sz = ndi.sum(M1, lab, index=np.arange(1, n + 1))
M1 = np.isin(lab, [i for i, s in enumerate(sz, 1) if s > 3000])
# dirt clump on the broken stem of the lying mushroom (dark brown, belongs to the mushroom)
CLUMP = [(632, 500), (650, 470), (700, 465), (722, 490), (715, 525), (690, 545), (655, 540), (634, 525)]
pm = Image.new('L', (W, H), 0); ImageDraw.Draw(pm).polygon(CLUMP, fill=255)
M2 = ndi.binary_fill_holes(M1 | (np.array(pm) > 0))
M2 = ndi.binary_fill_holes(ndi.binary_closing(M2, structure=disk(9)))        # stems have darker shaded edges: close them
M3 = ndi.binary_dilation(M2, structure=disk(5)) & (al > 0) & (Y <= 556)     # dark outlines belong to the mushroom
M3 = ndi.binary_fill_holes(M3)
M3 = ndi.gaussian_filter(M3.astype(float), 2.5) > .5                         # smooth the ragged lower ends

# 2) layers.  The ground behind the stems is not in the picture, so it is rebuilt from the visible ground at the left of
#    the mushrooms (x 60..380, same rows; mirrored tiles): same soil colours, same wavy back edge. The cream stem colours
#    can never leak into it, because nothing is inpainted from the mushrooms.
cap = im.copy(); cap[~M3, 3] = 0
net = im.copy()
M3d = ndi.binary_dilation(M3, structure=disk(5))          # the faint anti-aliased rim of the caps also goes
SRC0, SRC1 = 60, 290
xs_all = np.arange(W)
u = (xs_all - SRC1) / float(SRC1 - SRC0)
ph = np.mod(u, 2.0)
src_x = np.clip(np.round(SRC0 + np.where(ph < 1, ph, 2 - ph) * (SRC1 - SRC0)).astype(int), SRC0, SRC1)
tile_rgb = im[:, src_x, :3]; tile_al = im[:, src_x, 3].astype(float) * (~M3d[:, src_x])
soft = ndi.gaussian_filter(M3d.astype(float), 1.5)          # feathered, so the patch blends into the ground in front of it
fill = soft > 0.02
w = np.clip(soft * 1.0, 0, 1)[..., None]
w = np.where(M3d[..., None], 1.0, w)
net_rgb = im[..., :3] * (1 - w) + tile_rgb * w
net_al = im[..., 3].astype(float) * (1 - w[..., 0]) + tile_al * w[..., 0]
net[..., :3] = np.clip(net_rgb, 0, 255).astype(np.uint8); net[..., 3] = np.clip(net_al, 0, 255).astype(np.uint8)
# a small stem fragment the tile left standing above the ground edge (x 450..490, y 420..446)
net[420:447, 450:490, 3] = 0
net[445:455, 468:489, 3] = 0
box_l = (net[425:452, 450:500, :3].astype(float) @ np.array([.299, .587, .114]))   # cream fringe left on the ground edge
sub = net[425:452, 450:500, 3]; sub[box_l > 135] = 0
# drop floating leftovers (bits of stem / cap rim that are not attached to the block)
lb, nb = ndi.label(net[..., 3] > 40, structure=np.ones((3, 3)))
szb = ndi.sum(net[..., 3] > 40, lb, index=np.arange(1, nb + 1))
main = 1 + int(np.argmax(szb))
drop = (lb > 0) & (lb != main)
print('dropped floating pieces:', int((szb < szb.max()).sum()), 'px', int(drop.sum()))
net[drop, 3] = 0
Image.fromarray(cap).save(D + '/mushroom_cap_only.png', optimize=True)
Image.fromarray(net).save(D + '/mycelium_net_only.png', optimize=True)
info = {'canvas': [W, H], 'mushroom_bbox': [int(v) for v in (np.nonzero(M3.any(0))[0].min(), np.nonzero(M3.any(1))[0].min(), np.nonzero(M3.any(0))[0].max() + 1, np.nonzero(M3.any(1))[0].max() + 1)],
        'filled_px': int((M3).sum())}
print(json.dumps(info))
if DBG:
    bg = Image.new('RGBA', (W, H), (0x11, 0x26, 0x1f, 255))
    for nm, arr in [('cap', cap), ('net', net)]:
        b = bg.copy(); b.alpha_composite(Image.fromarray(arr)); b.save(f'{DBG}/layer_{nm}.png')
