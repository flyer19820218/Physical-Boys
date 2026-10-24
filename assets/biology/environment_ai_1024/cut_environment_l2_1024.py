#!/usr/bin/env python3
"""人類與環境第 2 課（人類活動與威脅）補圖處理（2026-10-25）。
用法：python3 -I cut_environment_l2_1024.py [原圖資料夾] [代號 ...]
原圖資料夾預設 ../../../local-backups/20261025/environment_l2_originals/
全幅場景縮成 1672 寬 jpg（原圖只有 1024 寬的不放大）；衍生圖 TH8、TH14b 已是定稿，只轉 jpg；
白底去背圖：去背、去白邊、依連通區塊分組後由左到右命名（TH5、TH11 手動指派）。
去背函式沿用 cut_environment_1024.py。
"""
import os, sys, json
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

HERE = os.path.dirname(os.path.abspath(__file__))
args = sys.argv[1:]
SRC = os.path.normpath(os.path.join(HERE, "../../../local-backups/20261025/environment_l2_originals/"))
if args and os.path.isdir(args[0]): SRC = args.pop(0)
ONLY = set(args)
OUT = HERE
MAXSIDE = 1400

SCENES = {   # 全幅場景
 "TH1a": ("TH1a_gemini_original.jpg", "TH1a_forest_top.jpg"),
 "TH1b": ("TH1b_gemini_original.jpg", "TH1b_farmland_top.jpg"),
 "TH3": ("TH3_gemini_original.png", "TH3_edge_section.jpg"),
 "TH6": ("TH6_gemini_original.jpg", "TH6_vine_smother.jpg"),
 "TH14a": ("TH14a_gemini_original.png", "TH14a_coral_healthy.jpg"),
 "TH8": ("TH8_derived_from_HB5.png", "TH8_pond_bloom.jpg"),             # 程式衍生（HB5 池塘染藻華），定稿，只轉 jpg
 "TH14b": ("TH14b_derived_from_TH14a.png", "TH14b_coral_bleached.jpg"),  # 程式衍生（TH14a 改白化），定稿，只轉 jpg
}
COVERS = {"TH0": ("TH0_gemini_original.jpg", "../../covers/biology_environmental_threats_1024_v1.jpg")}
# 代號 -> (原圖, [輸出，由左到右或手動順序], 門檻)
SHEETS = {
 "TH2":  ("TH2_gemini_original.jpg", ["TH2_leopard_cat_stand.png", "TH2_leopard_cat_walk.png"], 14),
 "TH4":  ("TH4_gemini_original.png", ["TH4_bluefin_adult.png", "TH4_bluefin_juvenile.png"], 14),
 "TH5":  ("TH5_gemini_original.jpg", ["TH5_red_eared_slider.png", "TH5_crayfish.png", "TH5_green_iguana.png", "TH5_spot_legged_treefrog.png"], 14),
 "TH10a": ("TH10a_gemini_original.jpg", ["TH10_factory.png", "TH10_traffic.png", "TH10_sprayer_field.png"], 14),
 "TH10b": ("TH10b_gemini_original.jpg", ["TH10_drain.png", "TH10_fish_farm.png", "TH10_livestock.png"], 14),
 "TH11": ("TH11_gemini_original.png", ["TH11_diatoms.png", "TH11_copepod.png", "TH11_sardine.png", "TH11_mackerel.png"], 30),
 "TH12": ("TH12_gemini_original.png", ["TH12_formosan_salmon.png", "TH12_alpine_rhododendron.png"], 14),
 "TH13": ("TH13_gemini_original.png", ["TH13_cherry_bloom.png", "TH13_cherry_buds.png", "TH13_white_eye.png"], 14),
}
FINE = {"TH11"}   # 細線多（觸角、絨毛）：不做開運算與侵蝕，用柔邊 alpha 並還原邊緣色

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

# 手動指派：以相對位置（x/寬、y/高）分組
def th5(x, y, sz):                       # 巴西龜、螯蝦、綠鬣蜥（含尾）、斑腿樹蛙（鬣蜥右上方）
    W, H = sz; fx, fy = x / W, y / H
    if fx < 0.30: return 0          # 巴西龜
    if fx < 0.50: return 1          # 螯蝦
    return 3 if (fx > 0.80 and fy < 0.52) else 2   # 樹蛙在鬣蜥右上方，重心 x>0.80、y<0.52
def th11(x, y, sz):                      # 矽藻鏈（左，斜放）、橈足類（中）、沙丁魚（右上）、鯖魚（右下）
    W, H = sz; fx, fy = x / W, y / H
    if fx > 0.62: return 2 if fy < 0.52 else 3
    return 0 if fx < 0.22 else 1
MANUAL = {"TH5": th5, "TH11": th11}
DIL = {"TH5": 4, "TH11": 8}

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
        im = im.resize((1672, round(im.height * 1672 / im.width)), Image.LANCZOS)
        dst = os.path.normpath(os.path.join(OUT, out)); im.save(dst, quality=88, optimize=True)
        report[code] = [os.path.basename(dst), *im.size]; print(code, dst, im.size)
    for code, (fn, outs, thr) in SHEETS.items():
        if ONLY and code not in ONLY: continue
        im = to_rgba(os.path.join(SRC, fn), thr, code in FINE)
        if code in MANUAL: parts = assign_groups(im, MANUAL[code], DIL[code])
        else:
            try: parts = split_cols(im, len(outs))
            except AssertionError: parts = assign_groups(im, by_cols([]), 3)
        assert len(parts) == len(outs), (code, len(parts))
        for name, part in zip(outs, parts):
            piece = shrink(trim(part)); piece.save(os.path.join(OUT, name), optimize=True)
            report[name] = [name, *piece.size]; print(code, name, piece.size)
    rp = os.path.join(OUT, "_report_environment_l2_1024.json")
    json.dump(report, open(rp, "w"), ensure_ascii=False, indent=1)
main()
