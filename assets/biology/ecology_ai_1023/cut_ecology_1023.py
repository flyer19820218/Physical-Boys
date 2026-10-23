#!/usr/bin/env python3
"""生物圈與生態關係（EC0～EC16）AI 插圖：備份原圖、去背、去白邊、依左右空隙切成單張。
用法：python3 cut_ecology_1023.py <原圖資料夾>   （資料夾內要有 ECx_gemini_original.jpg）
"""
import os, sys, json
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

SRC = sys.argv[1]
OUT = os.path.dirname(os.path.abspath(__file__))
COVERS = os.path.join(OUT, "..", "..", "covers")
MAXSIDE = 1400

# 編號 → (底色, 單張名稱由左到右；None=整張保留)
SPEC = {
 "EC1":  ("white", ["sunny_dry", "shady_moist"]),
 "EC3":  ("white", ["rice", "miscanthus", "foxtail"]),
 "EC4":  ("white", ["grasshopper", "caterpillar", "vole"]),
 "EC5":  ("white", ["mantis", "frog", "sparrow"]),
 "EC6":  ("white", ["snake", "eagle", "owl"]),
 "EC7":  ("white", ["leaf_green", "leaf_brown", "leaf_skeleton", "leaf_soil"]),
 "EC8":  ("white", ["camphor_tree"]),
 "EC9":  ("white", ["beetles_sap"]),
 "EC10": ("white", ["clownfish_anemone", "legume_nodules"]),
 "EC11": ("white", ["nest_fern", "remora_shark"]),
 "EC12": ("white", ["dodder", "wasp_cocoons"]),
 "EC13": ("white", ["mantis_grasshopper"]),
 "EC14a":("gray",  ["daphnia", "shrimp"]),
 "EC14b":("white", ["crucian", "bass"]),
 "EC15": ("white", ["apple_snail", "egg_mass", "field_snail"]),
 "EC16": ("gray",  ["spoonbill_stand", "spoonbill_fly"]),
}
THR = {"EC1": 60, "EC10": 30}   # 有柔光暈的圖，閾值放寬

def bgmask(a, kind, thr, pure_min=120):
    rgb = a[..., :3].astype(np.int16)
    if kind == "white":
        d = (255 - rgb).max(axis=2)
    else:
        ref = np.median(np.concatenate([rgb[:20, :20].reshape(-1, 3), rgb[-20:, -20:].reshape(-1, 3)]), axis=0)
        d = np.abs(rgb - ref).max(axis=2)
    cand = d <= thr
    lab, n = ndi.label(cand)
    border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    bg = np.isin(lab, list(border))
    # 被圈住的純背景（藤蔓圈、葉間空隙）也算背景
    pure = d <= 5
    lab2, n2 = ndi.label(pure)
    if n2:
        sizes = ndi.sum(pure, lab2, range(1, n2 + 1))
        big = [i + 1 for i, s in enumerate(sizes) if s >= pure_min]
        bg |= np.isin(lab2, big)
    return bg

def to_rgba(path, kind, thr, pure_min=120):
    im = Image.open(path).convert("RGB")
    a = np.array(im)
    bg = bgmask(a, kind, thr, pure_min)
    fg = ~bg
    fg = ndi.binary_opening(fg, iterations=1)
    fg = ndi.binary_erosion(fg, iterations=1)          # 去白邊
    # 只補小孔（主體內的高光點）；大的圈住區域維持透明
    holes, hn = ndi.label(~fg)
    if hn:
        hs = ndi.sum(~fg, holes, range(1, hn + 1))
        small = [i + 1 for i, v in enumerate(hs) if v < 150]
        fg |= np.isin(holes, small)
    alpha = ndi.gaussian_filter(fg.astype(np.float32), 0.9)
    alpha = np.clip((alpha - 0.2) / 0.6, 0, 1)
    out = np.dstack([a, (alpha * 255).astype(np.uint8)])
    return Image.fromarray(out, "RGBA")

def split_cols(im, n):
    al = np.array(im)[..., 3] > 16
    cols = al.sum(axis=0) > 2
    segs, start = [], None
    for x, v in enumerate(cols):
        if v and start is None: start = x
        if not v and start is not None:
            segs.append([start, x]); start = None
    if start is not None: segs.append([start, len(cols)])
    # 空隙 < 24 px 的相鄰段合併
    merged = []
    for s in segs:
        if merged and s[0] - merged[-1][1] < 24: merged[-1][1] = s[1]
        else: merged.append(s)
    # 太小的雜點段併入鄰段
    merged = [m for m in merged if m[1]-m[0] > 12] or merged
    while len(merged) > n:
        gaps = [merged[i+1][0]-merged[i][1] for i in range(len(merged)-1)]
        i = int(np.argmin(gaps)); merged[i][1] = merged[i+1][1]; del merged[i+1]
    return merged

def trim(im):
    bb = im.getchannel("A").point(lambda v: 255 if v > 16 else 0).getbbox()
    return im.crop(bb) if bb else im

def shrink(im):
    w, h = im.size; s = MAXSIDE / max(w, h)
    return im.resize((round(w*s), round(h*s)), Image.LANCZOS) if s < 1 else im

report = {}
for code, (kind, names) in SPEC.items():
    p = os.path.join(SRC, f"{code}_gemini_original.jpg")
    im = to_rgba(p, kind, THR.get(code, 14))
    segs = split_cols(im, len(names)) if len(names) > 1 else [[0, im.size[0]]]
    if len(segs) != len(names):
        print("!!", code, "段數", len(segs), "≠", len(names), segs)
    rec = []
    for (x0, x1), nm in zip(segs, names):
        src = im
        if code == "EC7" and nm == "leaf_skeleton":      # 葉脈網的小格子保持不透明，只去外圍背景
            src = to_rgba(p, kind, THR.get(code, 14), pure_min=1500)
        piece = trim(src.crop((max(0, x0-6), 0, min(im.size[0], x1+6), im.size[1])))
        piece = shrink(piece)
        fn = f"{code}_{nm}.png"
        piece.save(os.path.join(OUT, fn), optimize=True)
        rec.append([fn, piece.size[0], piece.size[1]])
    report[code] = rec
    print(code, rec)

# 全幅：EC0 封面、EC2 草地全景
def full(code, dest, width):
    im = Image.open(os.path.join(SRC, f"{code}_gemini_original.jpg")).convert("RGB")
    im = im.resize((width, round(im.size[1]*width/im.size[0])), Image.LANCZOS)
    im.save(dest, quality=88, optimize=True); return im.size
report["EC0"] = [["../../covers/biology_ecology_1023_v1.jpg", *full("EC0", os.path.join(COVERS, "biology_ecology_1023_v1.jpg"), 1672)]]
report["EC2"] = [["EC2_meadow_scene.jpg", *full("EC2", os.path.join(OUT, "EC2_meadow_scene.jpg"), 1672)]]
json.dump(report, open(os.path.join(OUT, "_report.json"), "w"), ensure_ascii=False, indent=1)
