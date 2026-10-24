#!/usr/bin/env python3
"""人類與環境（單元 11）補圖處理（2026-10-24）：全幅場景縮成 1672 寬 jpg；白底去背圖去背、去白邊、依左右空隙切開。
用法：python3 -I cut_environment_1024.py <原圖資料夾> [代號 ...]   （資料夾內是 BDx_gemini_original_a.jpg 等）
去背函式沿用 ecology_ai_1023/cut_ecology_l4_1024.py。一張圖裡有 n 個主體時，依最寬的 n-1 個空白欄切開，由左到右命名。
"""
import os, sys, json
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

SRC = sys.argv[1]
ONLY = set(sys.argv[2:])
OUT = os.path.dirname(os.path.abspath(__file__))
MAXSIDE = 1400

# 全幅場景（不去背）：代號 -> (原圖, 輸出)
SCENES = {
 "BD4": ("BD4_gemini_original.jpg", "BD4_reef.jpg"),
 "BD5": ("BD5_gemini_original.jpg", "BD5_mosaic.jpg"),
 "BD9a": ("BD9a_gemini_original.png", "BD9a_rainforest.jpg"),
 "BD9b": ("BD9b_gemini_original.png", "BD9b_palm_plantation.jpg"),
}
# 封面：輸出到 assets/covers/
COVERS = {
 "BD0": ("BD0_gemini_original.jpg", "../../covers/biology_environmental_diversity_1024_v1.jpg"),
}
# 白底去背（多主體）：代號 -> (原圖, [輸出...左到右], 門檻)
SHEETS = {
 "BD1a": ("BD1a_gemini_original_b.jpg", ["BD1_ladybird_orange19.png", "BD1_ladybird_orange0.png", "BD1_ladybird_black2red.png"], 14),
 "BD1b": ("BD1b_gemini_original_b.jpg", ["BD1_ladybird_black4red.png", "BD1_ladybird_pale.png", "BD1_ladybird_patch.png"], 14),
 "BD2":  ("BD2_gemini_original_a.jpg", ["BD2_rice_white.png", "BD2_rice_brown.png", "BD2_rice_black.png", "BD2_rice_red.png"], 14),
 "BD3":  ("BD3_gemini_original_b.jpg", ["BD3_honeybee.png", "BD3_dragonfly.png", "BD3_swallowtail.png", "BD3_cricket.png"], 8),
 "BD6":  ("BD6_gemini_original_a.jpg", ["BD6_blue_magpie.png", "BD6_muntjac.png", "BD6_swinhoes_pheasant.png", "BD6_macaque.png"], 14),
 "BD8a": ("BD8a_gemini_original.jpg", ["BD8_cotton.png", "BD8_silk_cocoons.png", "BD8_timber.png"], 14),
 "BD8b": ("BD8b_gemini_original.png", ["BD8_rubber_tapping.png", "BD8_yew.png", "BD8_bamboo.png"], 14),
 "BD7":  ("BD7_gemini_original.png", ["BD7_chub.png", "BD7_mayfly_nymph.png", "BD7_dipper.png", "BD7_river_snail.png"], 14),
}

# 手動分界（原圖 x，依連通區塊重心分組）：
MANUAL = {"BD3": [341, 684, 1035], "BD6": [360, 690, 1010], "BD8a": [450, 920], "BD8b": [330, 690], "BD7": [330, 540, 790]}

NOENCLOSED = {"BD6": -6, "BD8a": -6, "BD8b": -6}
ANTILEAK = {"BD6", "BD8a", "BD8b"}   # 主體本身有大片白色（白尾、棉花、蠶繭）：只去掉與邊緣相連的背景

def bgmask(a, thr, pure_min=120, anti_leak=False):
    rgb = a[..., :3].astype(np.int16)
    d = (255 - rgb).max(axis=2)
    cand = d <= thr
    lab, n = ndi.label(cand)
    border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    bg = np.isin(lab, list(border))
    pure = d <= 5
    lab2, n2 = ndi.label(pure)
    if n2:
        if pure_min < 0:          # 薄的被圈住背景才去掉（細縫、枝葉間空隙）；白色主體（棉花、繭）內部的大塊白保留
            edt = ndi.distance_transform_edt(pure)
            mx = ndi.maximum(edt, lab2, range(1, n2 + 1))
            sizes = ndi.sum(pure, lab2, range(1, n2 + 1))
            big = [i + 1 for i, (m, z) in enumerate(zip(mx, sizes)) if z >= 30 and m <= -pure_min]
        else:
            sizes = ndi.sum(pure, lab2, range(1, n2 + 1))
            big = [i + 1 for i, z in enumerate(sizes) if z >= pure_min]
        bg |= np.isin(lab2, big)
    if anti_leak:
        op = ndi.binary_opening(bg, iterations=5)
        l3, n3 = ndi.label(op)
        bd = set(np.unique(np.concatenate([l3[0], l3[-1], l3[:, 0], l3[:, -1]]))) - {0}
        keep = np.isin(l3, list(bd))
        bg = ndi.binary_dilation(keep, iterations=7) & bg
    return bg

def to_rgba(path, thr, pure_min=120, anti_leak=False):
    a = np.array(Image.open(path).convert("RGB"))
    fg = ~bgmask(a, thr, pure_min, anti_leak)
    fg = ndi.binary_opening(fg, iterations=1)
    fg = ndi.binary_erosion(fg, iterations=1)          # 去白邊
    holes, hn = ndi.label(~fg)
    if hn:
        hs = ndi.sum(~fg, holes, range(1, hn + 1))
        small = [i + 1 for i, v in enumerate(hs) if v < 150]
        fg |= np.isin(holes, small)
    alpha = ndi.gaussian_filter(fg.astype(np.float32), 0.9)
    alpha = np.clip((alpha - 0.2) / 0.6, 0, 1)
    return Image.fromarray(np.dstack([a, (alpha * 255).astype(np.uint8)]), "RGBA")

# 去背後仍殘留的近白像素（針葉之間、筍殼邊緣的白縫）：這幾張的主體沒有白色，直接去掉
KEYWHITE = {"BD8_yew.png", "BD8_bamboo.png"}
def key_white(im):
    a = np.array(im); rgb = a[..., :3].astype(np.int16)
    white = (rgb.min(axis=2) > 200) & ((rgb.max(axis=2) - rgb.min(axis=2)) < 35)
    white = ndi.binary_dilation(white, iterations=1) & (rgb.min(axis=2) > 170)
    al = np.where(white, 0, a[..., 3]).astype(np.float32)
    al = ndi.gaussian_filter(al, 0.7)
    a[..., 3] = np.clip((al - 40) * 255 / 175, 0, 255).astype(np.uint8)
    return Image.fromarray(a, "RGBA")

def trim(im):
    bb = im.getchannel("A").point(lambda v: 255 if v > 16 else 0).getbbox()
    return im.crop(bb) if bb else im

def shrink(im):
    w, h = im.size; s = MAXSIDE / max(w, h)
    return im.resize((round(w*s), round(h*s)), Image.LANCZOS) if s < 1 else im

def split_by_components(im, cuts):
    """欄位投影有重疊（翅膀、觸角伸到隔壁）時：每個連通區塊依重心 x 分給哪一組。"""
    al = np.array(im.getchannel("A")) > 16
    lab, n = ndi.label(ndi.binary_dilation(al, iterations=3))
    cx = ndi.center_of_mass(al, lab, range(1, n + 1))
    edges = [-1] + list(cuts) + [10**9]
    out = []
    for k in range(len(cuts) + 1):
        keep = np.zeros_like(al)
        for i, (cy, x) in enumerate(cx):
            if edges[k] <= x < edges[k + 1]: keep |= (lab == i + 1)
        a = np.array(im); a[..., 3] = np.where(keep, a[..., 3], 0)
        out.append(Image.fromarray(a, "RGBA"))
    return out

def split_cols(im, n):
    col = np.array(im.getchannel("A")).max(axis=0) > 16
    empty = ~col
    runs, i = [], 0
    while i < len(empty):
        if empty[i]:
            j = i
            while j < len(empty) and empty[j]: j += 1
            if i > 0 and j < len(empty): runs.append((j - i, i, j))
            i = j
        else: i += 1
    cuts = sorted((s + e) // 2 for _, s, e in sorted(runs, reverse=True)[:n - 1])
    assert len(cuts) == n - 1, f"找不到 {n-1} 個空白欄"
    edges = [0] + cuts + [im.width]
    return [im.crop((edges[k], 0, edges[k + 1], im.height)) for k in range(n)]

report = {}
for code, (fn, out) in SCENES.items():
    if ONLY and code not in ONLY: continue
    im = Image.open(os.path.join(SRC, fn)).convert("RGB")
    if im.width > 1672 or code in ("BD4", "BD5"): im = im.resize((1672, round(im.height * 1672 / im.width)), Image.LANCZOS)   # 不放大（BD9 原圖只有 1024 寬）
    im.save(os.path.join(OUT, out), quality=88, optimize=True)
    report[code] = [out, *im.size]; print(code, out, im.size)
for code, (fn, out) in COVERS.items():
    if ONLY and code not in ONLY: continue
    im = Image.open(os.path.join(SRC, fn)).convert("RGB")
    im = im.resize((1672, round(im.height * 1672 / im.width)), Image.LANCZOS)
    dst = os.path.normpath(os.path.join(OUT, out))
    im.save(dst, quality=88, optimize=True)
    report[code] = [os.path.basename(dst), *im.size]; print(code, dst, im.size)
for code, (fn, outs, thr) in SHEETS.items():
    if ONLY and code not in ONLY: continue
    im = to_rgba(os.path.join(SRC, fn), thr, NOENCLOSED.get(code, 120), code in ANTILEAK)
    parts = split_by_components(im, MANUAL[code]) if code in MANUAL else split_cols(im, len(outs))
    for name, part in zip(outs, parts):
        if name in KEYWHITE: part = key_white(part)
        piece = shrink(trim(part))
        piece.save(os.path.join(OUT, name), optimize=True)
        report[name] = [name, *piece.size]; print(code, name, piece.size)
json.dump(report, open(os.path.join(OUT, "_report_environment_1024.json"), "w"), ensure_ascii=False, indent=1)
