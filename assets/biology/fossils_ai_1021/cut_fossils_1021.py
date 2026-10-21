#!/usr/bin/env python3
"""化石課（fossils_evolution）的 Gemini 插圖：去背、切開、縮圖。2026-10-21。
用法：python3 cut_fossils_1021.py <原始圖資料夾> <輸出資料夾>
原始圖：FO0_cover.jpg、FO1_three_fossils.jpg、FO2_trilobite_reconstruction.jpg、FO3_five_horse_skeletons.jpg、
FO4_five_forefoot_bones_screenshot.png、FO6_coral_cliff_screenshot.png、FO7_reef_screenshot.png
方法（與前幾課相同）：從圖邊緣連通、與背景色差在容差內的區域變透明；內部接近純背景色的區塊（肋骨之間、腳趾之間）也透明；
緊鄰透明區的 3 px 依顏色距離做半透明並扣掉背景色，放到黑板底色上不會有白邊。
同一張圖切出的多個東西用同一個縮放比例，所以相對大小不變。
"""
import sys, json, os
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

SRC, OUT = sys.argv[1], sys.argv[2]
os.makedirs(OUT, exist_ok=True)
LOG = {}


def load(name, crop=None):
    im = Image.open(os.path.join(SRC, name)).convert('RGB')
    if crop:  # (左, 上, 右, 下) 各裁掉幾 px（螢幕截圖的外框）
        l, t, r, b = crop
        im = im.crop((l, t, im.width - r, im.height - b))
    return im


def matte(im, tol_edge=26, tol_inner=7, inner_min=9):
    """回傳 RGBA。背景色取四邊中位數。"""
    a = np.asarray(im).astype(np.float32)
    h, w, _ = a.shape
    border = np.concatenate([a[0], a[-1], a[:, 0], a[:, -1]])
    bg = np.median(border, axis=0)
    dist = np.sqrt(((a - bg) ** 2).sum(axis=2))
    # 1) 與邊緣連通的背景
    near = dist <= tol_edge
    lab, n = ndi.label(near)
    edge_labels = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    bgmask = np.isin(lab, list(edge_labels))
    # 2) 內部非常接近純背景色、而且夠大的區塊（肋骨之間的空隙）
    pure = dist <= tol_inner
    lab2, n2 = ndi.label(pure)
    if n2:
        sizes = ndi.sum(pure, lab2, index=np.arange(1, n2 + 1))
        big = np.isin(lab2, np.where(sizes >= inner_min)[0] + 1)
        bgmask |= big
    # 3) 邊緣半透明：緊鄰背景的 3 px
    near_bg = ndi.binary_dilation(bgmask, iterations=3) & ~bgmask
    alpha = np.ones((h, w), np.float32)
    alpha[bgmask] = 0
    soft = np.clip((dist - tol_inner) / (tol_edge * 1.6 - tol_inner), 0, 1)
    alpha[near_bg] = np.maximum(soft[near_bg], 0.0)
    # 扣掉背景色
    rgb = a.copy()
    m = near_bg & (alpha > 0.02)
    rgb[m] = (a[m] - (1 - alpha[m, None]) * bg) / np.maximum(alpha[m, None], 0.02)
    rgb = np.clip(rgb, 0, 255)
    out = np.dstack([rgb, alpha * 255]).astype(np.uint8)
    return Image.fromarray(out, 'RGBA'), alpha > 0.04


def split(rgba, mask, merge=14, min_area=4000):
    """依連通區塊切開（先膨脹 merge px，讓同一個東西的零件連在一起）。回傳 [(box, crop)] 由左到右。"""
    big = ndi.binary_dilation(mask, iterations=merge)
    lab, n = ndi.label(big)
    objs = []
    for i in range(1, n + 1):
        ys, xs = np.where((lab == i) & mask)
        if len(xs) < min_area:
            continue
        box = (int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1)
        objs.append((box, ndi.binary_dilation(lab == i, iterations=4)))
    objs.sort(key=lambda b: b[0][0])
    return objs


def save_cut(rgba, box, name, scale, pad=2, keep=None):
    l, t, r, b = box
    l, t = max(0, l - pad), max(0, t - pad)
    r, b = min(rgba.width, r + pad), min(rgba.height, b + pad)
    c = rgba.crop((l, t, r, b))
    if keep is not None:  # 只保留這個東西：把相鄰東西的像素清掉（方框可能重疊）
        arr = np.array(c)
        arr[~keep[t:b, l:r], 3] = 0
        c = Image.fromarray(arr, 'RGBA')
    w, h = max(1, round(c.width * scale)), max(1, round(c.height * scale))
    c = c.resize((w, h), Image.LANCZOS)
    path = os.path.join(OUT, name)
    c.save(path, optimize=True)
    LOG[name] = {'box_in_source': [l, t, r, b], 'scale': scale, 'size': [w, h], 'bytes': os.path.getsize(path)}
    return path


def cut_group(src_name, names, scale, crop=None, **kw):
    im = load(src_name, crop)
    rgba, mask = matte(im, **{k: v for k, v in kw.items() if k in ('tol_edge', 'tol_inner', 'inner_min')})
    boxes = split(rgba, mask, **{k: v for k, v in kw.items() if k in ('merge', 'min_area')})
    if len(boxes) != len(names):
        raise SystemExit(f'{src_name}: 找到 {len(boxes)} 個東西，預期 {len(names)}：{boxes}')
    for (box, keep), name in zip(boxes, names):
        save_cut(rgba, box, name, scale, keep=keep)


# FO0 封面：等比例縮為 1672 px 寬的 JPEG，不裁切
cov = load('FO0_cover.jpg')
cov = cov.resize((1672, round(cov.height * 1672 / cov.width)), Image.LANCZOS)
cov.save(os.path.join(OUT, 'cover_biology_fossils_evolution_1021_v1.jpg'), quality=88, optimize=True)

# FO1 三種化石
cut_group('FO1_three_fossils.jpg', ['fossil_trilobite_slab.png', 'fossil_footprints_slab.png', 'fossil_amber_insect.png'], 0.38)
# FO2 三葉蟲復原圖
cut_group('FO2_trilobite_reconstruction.jpg', ['trilobite_walking.png', 'trilobite_enrolled.png'], 0.38)
# FO3 五隻馬骨架（同一縮放比例，相對大小不變）
cut_group('FO3_five_horse_skeletons.jpg',
          ['horse_1_hyracotherium.png', 'horse_2_mesohippus.png', 'horse_3_merychippus.png', 'horse_4_pliohippus.png', 'horse_5_equus.png'],
          0.5, merge=10)
# FO4 五組前腳骨（螢幕截圖，裁掉外框：上 8、其他 8）
cut_group('FO4_five_forefoot_bones_screenshot.png',
          ['foot_1.png', 'foot_2.png', 'foot_3.png', 'foot_4.png', 'foot_5.png'],
          0.5, crop=(8, 8, 8, 8), merge=10)

# FO6、FO7 全幅場景：裁掉截圖外框、存 JPEG
for src, name, crop in [('FO6_coral_cliff_screenshot.png', 'coral_fossil_cliff.jpg', (8, 8, 8, 8)),
                        ('FO7_reef_screenshot.png', 'coral_reef_today.jpg', (8, 8, 8, 8))]:
    im = load(src, crop)
    im.save(os.path.join(OUT, name), quality=88, optimize=True)
    LOG[name] = {'size': list(im.size), 'bytes': os.path.getsize(os.path.join(OUT, name))}

json.dump(LOG, open(os.path.join(OUT, 'cut_log.json'), 'w'), ensure_ascii=False, indent=1)
for k, v in LOG.items():
    print(k, v.get('size'), v.get('bytes'))
