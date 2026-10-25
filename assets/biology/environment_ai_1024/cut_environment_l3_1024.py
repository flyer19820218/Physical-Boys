#!/usr/bin/env python3
"""人類與環境第 3 課（保育與永續）圖片處理（2026-10-25）。
用法：python3 -I cut_environment_l3_1024.py [原圖資料夾] [代號 ...]
原圖資料夾預設 ../../../local-backups/20261025/environment_l3_originals/
全幅場景存成 jpg（原圖只有 1024 寬，不放大；超過 1672 寬才縮）；封面同樣不放大；
白底去背圖：去背、去白邊、依空白欄切開後由左到右命名。
去背函式沿用 cut_environment_l2_1024.py。
"""
import os, sys, json
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

HERE = os.path.dirname(os.path.abspath(__file__))
args = sys.argv[1:]
SRC = os.path.normpath(os.path.join(HERE, "../../../local-backups/20261025/environment_l3_originals/"))
if args and os.path.isdir(args[0]): SRC = args.pop(0)
ONLY = set(args)
OUT = HERE
MAXSIDE = 1400

SCENES = {   # 全幅場景（原圖 1024×572，不放大）
 "CV2": ("CV2_gemini_original.png", "CV2_nesting_beach.jpg"),
 "CV3": ("CV3_gemini_original.png", "CV3_seagrass.jpg"),
 "CV5a": ("CV5a_gemini_original.png", "CV5a_weir.jpg"),
 "CV5b": ("CV5b_gemini_original.png", "CV5b_weir_fishway.jpg"),
 "CV5c": ("CV5c_gemini_original.png", "CV5c_fishway_section.jpg"),
 "CV6a": ("CV6a_gemini_original.png", "CV6a_overpass.jpg"),
 "CV6b": ("CV6b_gemini_original.png", "CV6b_underpass.jpg"),
 "CV7b": ("CV7b_gemini_original.png", "CV7b_ir_frame.jpg"),
}
COVERS = {"CV0": ("CV0_gemini_original.png", "../../covers/biology_environmental_conservation_1024_v1.jpg")}
# 代號 -> (原圖, [輸出，由左到右], 門檻)
SHEETS = {
 "CV1a": ("CV1a_gemini_original.png", ["CV1_green_turtle_adult.png", "CV1_green_turtle_tagged.png", "CV1_hatchling.png"], 14),
 "CV1b": ("CV1b_gemini_original.png", ["CV1_juvenile.png", "CV1_nest_cutaway.png"], 14),
 "CV5d": ("CV5d_gemini_original.png", ["CV5_eel.png", "CV5_goby.png"], 14),
 "CV7a": ("CV7a_gemini_original.png", ["CV7_camera_trap.png"], 14),
 "CV8a": ("CV8a_gemini_original.png", ["CV8_reusable_cup.png", "CV8_paper_cups.png", "CV8_tote_bag.png"], 14),
 "CV8b": ("CV8b_gemini_original.png", ["CV8_bicycle.png", "CV8_bus.png", "CV8_meal_set.png"], 14),
 "CV9": ("CV9_gemini_original.png", ["CV9_notebook.png", "CV9_binoculars.png", "CV9_camera.png", "CV9_hand_lens.png"], 14),
 "CV10": ("CV10_gemini_original.png", ["CV10_flying_fish_glide.png", "CV10_flying_fish_swim.png"], 14),
 "CV11": ("CV11_gemini_original.png", ["CV11_bamboo.png", "CV11_pandan.png", "CV11_areca_sheath.png", "CV11_banana_leaf.png"], 14),
}
FINE = set()

def bgmask(a, thr, pure_min=120):
    rgb = a[..., :3].astype(np.int16)
    d = (255 - rgb).max(axis=2)
    cand = d <= thr
    lab, n = ndi.label(cand)
    border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    bg = np.isin(lab, list(border))
    pure = d <= 5
    lab2, n2 = ndi.label(pure)
    if n2:
        sizes = ndi.sum(pure, lab2, range(1, n2 + 1))
        bg |= np.isin(lab2, [i + 1 for i, z in enumerate(sizes) if z >= pure_min])
    return bg

def to_rgba(path, thr, fine=False):
    a = np.array(Image.open(path).convert("RGB"))
    bg = bgmask(a, thr)
    fg = ~bg
    if fine:
        d = (255 - a.astype(np.int16)).max(axis=2).astype(np.float32)
        # 去掉淡灰細紋：太小的零碎前景區塊（與主體不相連）
        lab, n = ndi.label(ndi.binary_dilation(fg, iterations=2))
        sizes = ndi.sum(fg, lab, range(1, n + 1))
        keep = np.isin(lab, [i + 1 for i, z in enumerate(sizes) if z >= 60])
        fg &= keep
        soft = np.clip((d - thr) / 40.0, 0, 1)
        alpha = np.where(fg, np.maximum(soft, 0.55), 0)
        alpha = np.where(fg & (d < thr + 8), soft + 0.0, alpha)
        core = ndi.binary_erosion(ndi.binary_fill_holes(fg), iterations=3)   # 淺色魚腹等實心區域：不透明
        alpha = np.where(core, 1.0, alpha)
        alpha = np.clip(alpha, 0, 1)
        rgb = a.astype(np.float32)
        al = np.maximum(alpha, 1e-3)[..., None]
        rgb = np.clip((rgb - 255 * (1 - al) * 0.5) / (1 - (1 - al) * 0.5), 0, 255)   # 去除一半白色滲色
        return Image.fromarray(np.dstack([rgb.astype(np.uint8), (alpha * 255).astype(np.uint8)]), "RGBA")
    fg = ndi.binary_opening(fg, iterations=1)
    fg = ndi.binary_erosion(fg, iterations=1)          # 去白邊
    holes, hn = ndi.label(~fg)
    if hn:
        hs = ndi.sum(~fg, holes, range(1, hn + 1))
        fg |= np.isin(holes, [i + 1 for i, v in enumerate(hs) if v < 150])
    alpha = ndi.gaussian_filter(fg.astype(np.float32), 0.9)
    alpha = np.clip((alpha - 0.2) / 0.6, 0, 1)
    return Image.fromarray(np.dstack([a, (alpha * 255).astype(np.uint8)]), "RGBA")

def trim(im):
    bb = im.getchannel("A").point(lambda v: 255 if v > 16 else 0).getbbox()
    return im.crop(bb) if bb else im

def shrink(im):
    w, h = im.size; s = MAXSIDE / max(w, h)
    return im.resize((round(w*s), round(h*s)), Image.LANCZOS) if s < 1 else im

def components(im, dil):
    al = np.array(im.getchannel("A")) > 16
    lab, n = ndi.label(ndi.binary_dilation(al, iterations=dil))
    lab = lab * al                      # 只保留原本有像素的位置
    idx = [i for i in range(1, n + 1) if (lab == i).any()]
    cm = {i: ndi.center_of_mass(lab == i, ) for i in idx}
    return al, lab, idx, cm

def assign_groups(im, fn, dil=3):
    """每個連通區塊依重心 (x,y) 由 fn 指派組別；回傳各組的圖。"""
    al, lab, idx, cm = components(im, dil)
    ng = max(fn(x, y, im.size) for i in idx for (y, x) in [cm[i]]) + 1
    outs = []
    for k in range(ng):
        keep = np.zeros_like(al)
        for i in idx:
            y, x = cm[i]
            if fn(x, y, im.size) == k: keep |= (lab == i)
        a = np.array(im); a[..., 3] = np.where(keep, a[..., 3], 0)
        outs.append(Image.fromarray(a, "RGBA"))
    return outs

def by_cols(cuts):
    return lambda x, y, sz: sum(x >= c for c in cuts)

def split_cols(im, n):
    col = np.array(im.getchannel("A")).max(axis=0) > 16
    empty = ~col; runs, i = [], 0
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

FILL = {"CV1b"}   # 卵窩的白色卵被當成背景挖洞：把被主體包住的洞補回不透明
COMP = {"CV1a", "CV5d"}   # 主體在水平方向有重疊、沒有空白欄：改用連通區塊，依重心 x 由左到右
def by_components(im, n):
    al, lab, idx, cm = components(im, 3)
    big = sorted(idx, key=lambda i: -(lab == i).sum())[:n]
    big.sort(key=lambda i: cm[i][1])
    outs = []
    for i in big:
        a = np.array(im); a[..., 3] = np.where(lab == i, a[..., 3], 0)
        outs.append(Image.fromarray(a, "RGBA"))
    return outs

def main():
    report = {}
    for code, (fn, out) in SCENES.items():
        if ONLY and code not in ONLY: continue
        im = Image.open(os.path.join(SRC, fn)).convert("RGB")
        if im.width > 1672: im = im.resize((1672, round(im.height * 1672 / im.width)), Image.LANCZOS)   # 不放大
        im.save(os.path.join(OUT, out), quality=88, optimize=True)
        report[code] = [out, *im.size]; print(code, out, im.size)
    for code, (fn, out) in COVERS.items():
        if ONLY and code not in ONLY: continue
        im = Image.open(os.path.join(SRC, fn)).convert("RGB")
        if im.width > 1672: im = im.resize((1672, round(im.height * 1672 / im.width)), Image.LANCZOS)   # 不放大
        dst = os.path.normpath(os.path.join(OUT, out)); im.save(dst, quality=88, optimize=True)
        report[code] = [os.path.basename(dst), *im.size]; print(code, dst, im.size)
    for code, (fn, outs, thr) in SHEETS.items():
        if ONLY and code not in ONLY: continue
        im = to_rgba(os.path.join(SRC, fn), thr, code in FINE)
        if code in FILL:
            a = np.array(im); m = a[..., 3] > 16
            hole = ndi.binary_fill_holes(m & (a[..., 3] > 200)) & ~(m & (a[..., 3] > 200))   # 只算實心前景包住的洞（含半透明邊緣）
            a[..., :3] = np.where(hole[..., None], np.array(Image.open(os.path.join(SRC, fn)).convert("RGB")), a[..., :3])
            a[..., 3] = np.where(hole, 255, a[..., 3]); im = Image.fromarray(a, "RGBA")
        if code in COMP: parts = by_components(im, len(outs))
        else:
            try: parts = split_cols(im, len(outs))
            except AssertionError: parts = assign_groups(im, by_cols([]), 3)
        assert len(parts) == len(outs), (code, len(parts))
        for name, part in zip(outs, parts):
            piece = shrink(trim(part)); piece.save(os.path.join(OUT, name), optimize=True)
            report[name] = [name, *piece.size]; print(code, name, piece.size)
    rp = os.path.join(OUT, "_report_environment_l3_1024.json")
    json.dump(report, open(rp, "w"), ensure_ascii=False, indent=1)
main()
