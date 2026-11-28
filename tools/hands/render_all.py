"""批次渲染姿勢庫＋輸出 anchors.json＋拼接樣張。

用法（在 tools/hands（需先 pip install bpy） 執行）：
  python3 render_all.py                          # 全部姿勢 × 4 視角，800px，輸出到 out/
  python3 render_all.py --poses fist,grip        # 只做某幾個姿勢
  python3 render_all.py --size 600 --out dev     # 小圖預覽
  python3 render_all.py --poses push --views side --size 1600 --out final   # 正式大圖
  python3 render_all.py --sheets-only            # 只用現有 PNG 重拼樣張
每張 PNG 檔名：<out>/<pose>_<view>.png；同資料夾寫 anchors.json（會與舊內容合併）。
所有圖同一比例尺（畫面寬 30 cm），掌心中心永遠在圖片正中央，方便對位。
"""
import argparse
import json
import math
import os
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import numpy as np
import build_hand_v2 as B
import poses_v2 as PV

ALL_VIEWS = ['side', 'top', 'three', 'palm']


def orient_matrix(deg):
    from mathutils import Euler
    return np.array(Euler([math.radians(a) for a in deg], 'XYZ').to_matrix())


def anchor_points(spec, sdf):
    """把錨點規格轉成手座標的點（以及圓柱的軸與半徑）。"""
    K = sdf.K
    kind = spec[0]
    if kind == 'surface':
        return dict(p=sdf.raymarch(np.array(spec[1], float), spec[2]))   # 從手內部往外找表面
    if kind == 'point':
        return dict(p=np.array(spec[1], float))
    if kind in ('tip', 'pad'):
        ch = K[spec[1]]
        J3, R2 = ch['J'][3], ch['R'][2]
        d = R2[:, 1] if kind == 'tip' else -R2[:, 2]
        return dict(p=sdf.raymarch(J3, d))
    if kind == 'hook':
        ch = K[spec[1]]
        m = ch['J'][1] + 0.7 * (ch['J'][2] - ch['J'][1])   # 中節靠指尖側的掌面（鉤子內側）
        d = -ch['R'][1][:, 2]
        return dict(p=sdf.raymarch(m, d))
    if kind == 'cyl':
        return dict(p=np.array(spec[1], float), axis=B.nrm(spec[2]), radius=float(spec[3]))
    raise ValueError(kind)


def render_pose(name, views, size, samples, outdir, h):
    import bpy
    from mathutils import Matrix
    pose = PV.POSES[name]
    B.clear_scene()
    sc = B.setup_scene(size=size, samples=samples)
    t0 = time.time()
    ob, sdf = B.build(pose['angles'], h=h)
    mat = B.make_material()
    ob.data.materials.append(mat)
    Rm = orient_matrix(pose['orient'])
    M = np.eye(4); M[:3, :3] = Rm
    ob.matrix_world = Matrix(M.tolist())
    target = Rm @ np.array(B.PALM_CENTER)
    print(f'[{name}] 建模 {time.time() - t0:.1f}s, 頂點 {len(ob.data.vertices)}', flush=True)

    # 錨點（手座標 → 世界座標）
    anchors = {}
    for an, a in pose['anchors'].items():
        ap = anchor_points(a['spec'], sdf)
        rec = dict(hand_cm=[round(float(x), 3) for x in ap['p']],
                   world_cm=[round(float(x), 3) for x in Rm @ ap['p']],
                   force_world=list(a['force']) if a.get('force') else None, views={})
        if 'axis' in ap:
            rec['axis_world'] = [round(float(x), 4) for x in Rm @ ap['axis']]
            rec['radius_cm'] = ap['radius']
        anchors[an] = (rec, Rm @ ap['p'], ap)

    info = dict(angles=pose['angles'], orient=list(pose['orient']), views={}, anchors={})
    s = size / B.ORTHO_CM
    for v in views:
        co, xc, yc, zc = B.place_camera(v, target)
        B.set_light(mat, xc, yc, zc)
        fn = f'{name}_{v}.png'
        sc.render.filepath = os.path.join(outdir, fn)
        t1 = time.time()
        bpy.ops.render.render(write_still=True)
        from PIL import Image
        im = Image.open(os.path.join(outdir, fn))
        bbox = im.getchannel('A').point(lambda a: 255 if a > 8 else 0).getbbox()
        info['views'][v] = dict(file=fn, size=size, px_per_cm=round(s, 4),
                                bbox_px=list(bbox) if bbox else None)
        for an, (rec, pw, ap) in anchors.items():
            px = B.project_px(pw, (xc, yc, zc), target, size)
            vr = dict(px=[round(px[0], 1), round(px[1], 1)], cm=[round(px[0] / s, 2), round(px[1] / s, 2)])
            if rec['force_world']:
                f = np.array(rec['force_world'], float)
                f2 = np.array([f @ xc, -(f @ yc)])
                n2 = np.linalg.norm(f2)
                vr['force_px'] = [round(float(x), 3) for x in f2 / n2] if n2 > 0.2 else None  # None＝力沿視線方向
            if 'axis' in ap:
                a = Rm @ ap['axis']
                a2 = np.array([a @ xc, -(a @ yc)])
                vr['axis_px'] = [round(float(x), 3) for x in a2]
                vr['radius_px'] = round(ap['radius'] * s, 1)
            rec['views'][v] = vr
        print(f'  {v}: {time.time() - t1:.1f}s', flush=True)
    for an, (rec, _, _) in anchors.items():
        info['anchors'][an] = rec
    return info


def overlay(im, pinfo, view, scale=1.0):
    """在預覽圖上畫錨點（紅點）與施力方向（藍箭頭），用來核對 anchors.json。"""
    from PIL import ImageDraw
    d = ImageDraw.Draw(im)
    for an, rec in pinfo['anchors'].items():
        vr = rec['views'].get(view)
        if not vr:
            continue
        x, y = vr['px'][0] * scale, vr['px'][1] * scale
        if 'radius_px' in vr:
            r = vr['radius_px'] * scale
            ax = np.array(vr['axis_px'])
            if np.linalg.norm(ax) > 0.3:     # 圓柱側面：畫兩條邊
                ax = ax / np.linalg.norm(ax); nx = np.array([-ax[1], ax[0]])
                for sgn in (-1, 1):
                    p0 = np.array([x, y]) + nx * r * sgn - ax * 4 * r
                    p1 = np.array([x, y]) + nx * r * sgn + ax * 4 * r
                    d.line([tuple(p0), tuple(p1)], fill=(60, 120, 220, 255), width=2)
            else:
                d.ellipse([x - r, y - r, x + r, y + r], outline=(60, 120, 220, 255), width=2)
        d.ellipse([x - 5, y - 5, x + 5, y + 5], fill=(230, 30, 30, 255))
        if vr.get('force_px'):
            fx, fy = vr['force_px']
            L = 60 * scale * 1.6
            x2, y2 = x + fx * L, y + fy * L
            d.line([(x, y), (x2, y2)], fill=(30, 90, 230, 255), width=4)
            a = math.atan2(fy, fx)
            for da in (2.6, -2.6):
                d.line([(x2, y2), (x2 + 14 * math.cos(a + da), y2 + 14 * math.sin(a + da))],
                       fill=(30, 90, 230, 255), width=4)


def make_sheets(outdir, info, poses, cell=500):
    from PIL import Image, ImageDraw

    def cellimg(p, v):
        fn = os.path.join(outdir, f'{p}_{v}.png')
        if not os.path.exists(fn):
            return None
        im = Image.open(fn).convert('RGBA')
        sc = cell / im.width
        im = im.resize((cell, cell), Image.LANCZOS)
        bg = Image.new('RGBA', (cell, cell), (255, 255, 255, 255))
        bg.alpha_composite(im)
        if p in info:
            overlay(bg, info[p], v, sc)
        ImageDraw.Draw(bg).text((10, 8), f'{p} / {v}', fill=(40, 40, 40, 255))
        return bg

    def grid(items, cols, fn):
        rows = math.ceil(len(items) / cols)
        W = Image.new('RGB', (cols * cell, rows * cell), 'white')
        for i, (p, v) in enumerate(items):
            c = cellimg(p, v)
            if c:
                W.paste(c.convert('RGB'), ((i % cols) * cell, (i // cols) * cell))
        W.save(os.path.join(HERE, fn))
        print('樣張', fn, W.size)
    grid([(p, 'three') for p in poses], 5, 'sheet_v2_pose.png')
    items = []
    for i in range(0, len(poses), 5):
        chunk = poses[i:i + 5]
        items += [(p, 'top') for p in chunk] + [(p, 'side') for p in chunk]
    grid(items, 5, 'sheet_v2_top.png')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--poses', default=','.join(PV.POSES))
    ap.add_argument('--views', default=','.join(ALL_VIEWS))
    ap.add_argument('--size', type=int, default=800)
    ap.add_argument('--samples', type=int, default=24)
    ap.add_argument('--h', type=float, default=0.11, help='建模網格大小 cm（小＝細，慢）')
    ap.add_argument('--out', default='out')
    ap.add_argument('--sheets-only', action='store_true')
    ap.add_argument('--no-sheets', action='store_true')
    a = ap.parse_args()
    outdir = os.path.join(HERE, a.out)
    os.makedirs(outdir, exist_ok=True)
    jf = os.path.join(outdir, 'anchors.json')
    info = json.load(open(jf)) if os.path.exists(jf) else {}
    poses = a.poses.split(',')
    if not a.sheets_only:
        for p in poses:
            info[p] = render_pose(p, a.views.split(','), a.size, a.samples, outdir, a.h)
            meta = dict(_說明='座標：px 為圖片像素(原點左上, y 向下)；cm = px / px_per_cm；'
                            'hand_cm 為手本身座標(手指+Y、手背+Z、拇指-X)；world_cm 為擺放後座標；'
                            'force_px 為該視角下施力方向的單位向量(圖片座標)，null 表示力沿視線方向。'
                            '所有圖畫面寬 30 cm，掌心中心在圖片正中央。')
            info['_meta'] = meta
            json.dump(info, open(jf, 'w'), ensure_ascii=False, indent=1)
    if not a.no_sheets:
        allp = [p for p in PV.POSES if p in info]
        make_sheets(outdir, info, allp)


if __name__ == '__main__':
    main()
