#!/usr/bin/env python3
"""為伽利略星球的「單元小牌子」產生縮圖。
每個單元挑一張代表封面（優先星號課，否則第一張有封面的課），裁成 3:2、縮到 192×128、低畫質 JPEG。
輸出：assets/museum/thumbs/<單元id>.jpg（每張約 5～9 KB）。可重複執行；來源是 assets/museum/data/lessons.json。
用法：python3 tools/museum/make_thumbs.py
"""
import json, os, sys
from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
OUT = os.path.join(ROOT, 'assets', 'museum', 'thumbs')
W, H = 192, 128

def main():
    data = json.load(open(os.path.join(ROOT, 'assets', 'museum', 'data', 'lessons.json'), encoding='utf-8'))
    os.makedirs(OUT, exist_ok=True)
    total = 0
    for hall in data['halls']:
        for unit in hall['units']:
            withcover = [l for l in unit['lessons'] if l.get('cover')]
            if not withcover:
                print('沒有封面：', unit['id']); continue
            pick = next((l for l in withcover if l.get('star')), withcover[0])
            src = os.path.join(ROOT, pick['cover'])
            im = Image.open(src).convert('RGB')
            w, h = im.size
            tw = h * W / H
            if tw <= w:   # 太寬：裁左右
                x0 = (w - tw) / 2; box = (x0, 0, x0 + tw, h)
            else:         # 太高：裁上下
                th = w * H / W; y0 = (h - th) / 2; box = (0, y0, w, y0 + th)
            im = im.resize((W, H), Image.LANCZOS, box=box)
            dst = os.path.join(OUT, unit['id'] + '.jpg')
            im.save(dst, 'JPEG', quality=60, optimize=True)
            total += os.path.getsize(dst)
    print('完成，共 %d KB' % (total // 1024))

if __name__ == '__main__':
    sys.exit(main())
