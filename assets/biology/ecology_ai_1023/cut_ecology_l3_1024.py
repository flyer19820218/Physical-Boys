#!/usr/bin/env python3
"""第 3 課補圖 EC19～EC23（2026-10-24）：去背、去白邊、整張保留，每張一個畫面。
用法：python3 cut_ecology_l3_1024.py <原圖資料夾>   （資料夾內要有 EC19_ladybird_gemini_original.jpg 等四張）
去背函式與 cut_ecology_1023.py 相同。
"""
import os, sys, json
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

SRC = sys.argv[1]
OUT = os.path.dirname(os.path.abspath(__file__))
MAXSIDE = 1400
SPEC = {
 "EC19_ladybird":  ("EC19_ladybird_gemini_original.jpg", "EC19_ladybird_aphids.png", 14),
 "EC20_wasp":      ("EC20_wasp_gemini_original.jpg", "EC20_wasp_caterpillar.png", 14),
 "EC21_cleaner":   ("EC21_cleaner_gemini_original.jpg", "EC21_cleaner_grouper.png", 14),
 "EC24_remora":    ("EC24_remora_shark_gemini_original.jpg", "EC24_remora_shark.png", 14),
 "EC25_cocoons":   ("EC25_cocoons_gemini_original.jpg", "EC25_wasp_cocoons.png", 14),
 "EC22_ducks":     ("EC22_ducks_gemini_original.jpg", "EC22_ducks_paddy.png", 14),
 "EC23_stags":     ("EC23_stags_gemini_original.jpg", "EC23_stags_duel.png", 14),
}

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

def trim(im):
    bb = im.getchannel("A").point(lambda v: 255 if v > 16 else 0).getbbox()
    return im.crop(bb) if bb else im

def shrink(im):
    w, h = im.size; s = MAXSIDE / max(w, h)
    return im.resize((round(w*s), round(h*s)), Image.LANCZOS) if s < 1 else im

report = {}
for code, (fn, out, thr) in SPEC.items():
    im = to_rgba(os.path.join(SRC, fn), "white", thr)
    piece = shrink(trim(im))
    piece.save(os.path.join(OUT, out), optimize=True)
    report[code] = [out, *piece.size]
    print(code, out, piece.size)
json.dump(report, open(os.path.join(OUT, "_report_l3_1024.json"), "w"), ensure_ascii=False, indent=1)
