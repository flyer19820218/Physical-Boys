#!/usr/bin/env python3
"""解析 index_classic.html（舊版清單，課程卡片都在這裡），產生 assets/museum/data/lessons.json（伽利略星球首頁的資料來源）。

用法（在專案根目錄）：
    python3 tools/museum/build_lessons.py            # 產生檔案並印出警告
    python3 tools/museum/build_lessons.py --check    # 只比對現有檔案是否過期（過期則結束碼 1）

規則：lessons.json 是產生的檔案，不要手改；新增或修改首頁卡片後重跑本腳本。
輸出不含時間戳，內容相同就不會產生 diff。
"""
import html
import json
import os
import re
import subprocess
import sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
INDEX = os.path.join(ROOT, 'index_classic.html')
OUT = os.path.join(ROOT, 'assets', 'museum', 'data', 'lessons.json')

# 館的固定資料（順序＝星球上的順序；顏色沿用首頁 :root 色票）
HALLS = [
    {'id': 'physics', 'zh': '物理', 'en': 'Physics', 'sub': {'zh': '牛頓', 'en': 'Newton'}, 'color': '#f2d675'},
    {'id': 'chemistry', 'zh': '化學', 'en': 'Chemistry', 'sub': {'zh': '拉瓦節', 'en': 'Lavoisier'}, 'color': '#f0955c'},
    {'id': 'earth', 'zh': '地科', 'en': 'Earth & Space', 'sub': {'zh': '魏格納', 'en': 'Wegener'}, 'color': '#6fa8f2'},
    {'id': 'biology', 'zh': '生物', 'en': 'Biology', 'sub': {'zh': '達爾文', 'en': 'Darwin'}, 'color': '#a8e6cf'},
]

TAG = re.compile(r'<[^>]+>')


def text_of(fragment):
    return html.unescape(TAG.sub('', fragment)).strip()


def load_en_dicts(src):
    """用 node 執行首頁裡的英文字典敘述（只取 INDEX_CARD_EN／INDEX_CATEGORY_EN 的行）。"""
    lines = [ln for ln in src.splitlines()
             if re.match(r'\s*(const\s+INDEX_(CARD|CATEGORY)_EN\b|INDEX_(CARD|CATEGORY)_EN\[)', ln)]
    js = ('var INDEX_CARD_EN, INDEX_CATEGORY_EN;\n'
          + '\n'.join(re.sub(r'^\s*const\s+', 'var ', ln) for ln in lines)
          + '\nprocess.stdout.write(JSON.stringify({card: INDEX_CARD_EN, cat: INDEX_CATEGORY_EN}));')
    res = subprocess.run(['node', '-e', js], capture_output=True, text=True)
    if res.returncode != 0:
        sys.exit('解析英文字典失敗：\n' + res.stderr)
    d = json.loads(res.stdout)
    return d['card'], d['cat']


def split_emoji(heading):
    """'🌊 波動與聲波' → ('🌊', '波動與聲波')"""
    parts = heading.strip().split(None, 1)
    if len(parts) == 2:
        return parts[0], parts[1]
    return '', heading.strip()


def build():
    src = open(INDEX, encoding='utf-8').read()
    card_en, cat_en = load_en_dicts(src)
    warnings = []

    ids = [h['id'] for h in HALLS]
    pos = {i: src.index('<div id="%s" class="subject-section' % i) for i in ids}
    order = sorted(ids, key=lambda i: pos[i])
    footer = src.index('<footer')
    bounds = {}
    for k, i in enumerate(order):
        bounds[i] = (pos[i], pos[order[k + 1]] if k + 1 < len(order) else footer)

    halls_out = []
    seen_files = set()
    for hall in HALLS:
        a, b = bounds[hall['id']]
        block = src[a:b]
        units = []
        for sec in re.split(r'(?=<section class="category)', block)[1:]:
            h2 = re.search(r'<h2>(.*?)</h2>', sec, re.S)
            heading = text_of(h2.group(1))
            emoji, zh_name = split_emoji(heading)
            en_heading = cat_en.get(heading)
            if en_heading:
                _, en_name = split_emoji(en_heading)
            else:
                en_name = zh_name
                warnings.append('單元缺英文名稱：%s' % heading)
            lessons = []
            for li in re.findall(r'<li>(.*?)</li>', sec, re.S):
                m = re.search(r'<a class="card" href="([^"#?]+)"', li)
                if not m:
                    continue
                href = m.group(1)
                title = text_of(re.search(r'class="card-title">(.*?)</span>', li, re.S).group(1))
                sub = text_of(re.search(r'class="card-sub">(.*?)</span>', li, re.S).group(1))
                img = re.search(r'<img src="([^"]+)"', li)
                cover = img.group(1) if img else None
                star = sub.rstrip().endswith('★')
                blurb = sub.rstrip().rstrip('★').strip()
                en = card_en.get(href)
                if en:
                    en_title, en_sub = en[0], en[1]
                    en_blurb = en_sub.rstrip().rstrip('★').strip()
                else:
                    en_title, en_blurb = title, blurb
                    warnings.append('課程缺英文：%s' % href)
                if not os.path.exists(os.path.join(ROOT, href)):
                    warnings.append('課程檔不存在：%s' % href)
                if cover is None:
                    warnings.append('沒有封面（UI 會用預設）：%s' % href)
                elif not os.path.exists(os.path.join(ROOT, cover)):
                    warnings.append('封面檔不存在：%s（%s）' % (href, cover))
                if href in seen_files:
                    warnings.append('重複的課程：%s' % href)
                seen_files.add(href)
                lessons.append({
                    'file': href,
                    'star': star,
                    'zh': {'title': title, 'blurb': blurb},
                    'en': {'title': en_title, 'blurb': en_blurb},
                    'cover': cover,
                })
            units.append({
                'id': '%s-%02d' % (hall['id'], len(units) + 1),
                'emoji': emoji,
                'zh': zh_name,
                'en': en_name,
                'lessons': lessons,
            })
        halls_out.append(dict(hall, units=units))

    total = sum(len(u['lessons']) for h in halls_out for u in h['units'])
    data = {
        'note': '由 tools/museum/build_lessons.py 從 index_classic.html 產生，請勿手改。',
        'total': total,
        'halls': halls_out,
    }
    return data, warnings


def main():
    data, warnings = build()
    text = json.dumps(data, ensure_ascii=False, indent=1) + '\n'
    if '--check' in sys.argv:
        old = open(OUT, encoding='utf-8').read() if os.path.exists(OUT) else ''
        if old != text:
            print('lessons.json 已過期：請執行 python3 tools/museum/build_lessons.py')
            sys.exit(1)
        print('lessons.json 與 index_classic.html 一致（%d 課）' % data['total'])
        return
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    open(OUT, 'w', encoding='utf-8').write(text)
    print('已寫入 %s' % os.path.relpath(OUT, ROOT))
    for h in data['halls']:
        print('  %s：%d 單元、%d 課' % (h['zh'], len(h['units']), sum(len(u['lessons']) for u in h['units'])))
    print('  總計 %d 課' % data['total'])
    if warnings:
        print('警告 %d 項：' % len(warnings))
        for w in warnings:
            print('  - ' + w)


if __name__ == '__main__':
    main()
