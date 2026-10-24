#!/usr/bin/env python3
"""第 4 課補圖 HB1～HB18（2026-10-24）：全幅場景轉 1672 寬 jpg；白底去背圖去背、去白邊、修邊。
用法：python3 cut_ecology_l4_1024.py <原圖資料夾>   （資料夾內是 HBx_..._gemini_original.jpg）
去背函式沿用 cut_ecology_l3_1024.py。駱駝與馴鹿在同一張圖裡，依中間的空白欄切開。
"""
import os, sys, json
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

SRC = sys.argv[1]
OUT = os.path.dirname(os.path.abspath(__file__))
MAXSIDE = 1400
SCENES = {   # 全幅場景（不去背）
 "HB1": ("HB1_forest_gemini_original.jpg", "HB1_forest.jpg"),
 "HB2": ("HB2_desert_gemini_original.jpg", "HB2_desert.jpg"),
 "HB3": ("HB3_tundra_gemini_original.jpg", "HB3_tundra.jpg"),
 "HB4": ("HB4_stream_gemini_original.jpg", "HB4_stream.jpg"),
 "HB5": ("HB5_pond_gemini_original.jpg", "HB5_pond.jpg"),
 "HB6": ("HB6_mangrove_gemini_original.jpg", "HB6_mangrove.jpg"),
 "HB10": ("HB10_rocky_shore_gemini_original.jpg", "HB10_rocky_shore.jpg"),
 "HB11": ("HB11_vent_gemini_original.jpg", "HB11_vent.jpg"),
 "HB14": ("HB14_mountain_gemini_original.jpg", "HB14_mountain.jpg"),
 "HB15": ("HB15_lowland_gemini_original.jpg", "HB15_lowland.jpg"),
 "HB16": ("HB16_cloudforest_gemini_original.jpg", "HB16_cloudforest.jpg"),
 "HB17": ("HB17_fir_gemini_original.jpg", "HB17_fir.jpg"),
 "HB18": ("HB18_alpine_gemini_original.jpg", "HB18_alpine.jpg"),
}
CUTS = {     # 白底去背：代號 -> (原圖, 輸出, 門檻)
 "HB7": ("HB7_mudskipper_gemini_original.jpg", "HB7_mudskipper.png", 14),
 "HB8": ("HB8_fiddler_crab_gemini_original.jpg", "HB8_fiddler_crab.png", 14),
 "HB9": ("HB9_giant_isopod_gemini_original.jpg", "HB9_giant_isopod.png", 9),
}
PAIR = ("HB12_13_camel_reindeer_gemini_original.jpg", ("HB12_camel.png", "HB13_reindeer.png"), 14)

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
        big = [i + 1 for i, s in enumerate(sizes) if s >= pure_min]
        bg |= np.isin(lab2, big)
    return bg

def to_rgba(path, thr):
    a = np.array(Image.open(path).convert("RGB"))
    fg = ~bgmask(a, thr)
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

def trim(im):
    bb = im.getchannel("A").point(lambda v: 255 if v > 16 else 0).getbbox()
    return im.crop(bb) if bb else im

def shrink(im):
    w, h = im.size; s = MAXSIDE / max(w, h)
    return im.resize((round(w*s), round(h*s)), Image.LANCZOS) if s < 1 else im

report = {}
for code, (fn, out) in SCENES.items():
    im = Image.open(os.path.join(SRC, fn)).convert("RGB")
    im = im.resize((1672, round(im.height * 1672 / im.width)), Image.LANCZOS)
    im.save(os.path.join(OUT, out), quality=88, optimize=True)
    report[code] = [out, *im.size]; print(code, out, im.size)
for code, (fn, out, thr) in CUTS.items():
    piece = shrink(trim(to_rgba(os.path.join(SRC, fn), thr)))
    piece.save(os.path.join(OUT, out), optimize=True)
    report[code] = [out, *piece.size]; print(code, out, piece.size)
fn, outs, thr = PAIR
im = to_rgba(os.path.join(SRC, fn), thr)
col = np.array(im.getchannel("A")).max(axis=0) > 16
empty = ~col
runs, i = [], 0
while i < len(empty):                                  # 找中間最寬的空白欄
    if empty[i]:
        j = i
        while j < len(empty) and empty[j]: j += 1
        runs.append((j - i, i, j)); i = j
    else: i += 1
w = len(empty)
mid = [r for r in runs if w * .3 < (r[1] + r[2]) / 2 < w * .7]
_, s, e = max(mid); cut = (s + e) // 2
for code, out, box in (("HB12", outs[0], (0, 0, cut, im.height)), ("HB13", outs[1], (cut, 0, w, im.height))):
    piece = shrink(trim(im.crop(box)))
    piece.save(os.path.join(OUT, out), optimize=True)
    report[code] = [out, *piece.size]; print(code, out, piece.size)
json.dump(report, open(os.path.join(OUT, "_report_l4_1024.json"), "w"), ensure_ascii=False, indent=1)
