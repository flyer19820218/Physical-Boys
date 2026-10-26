#!/usr/bin/env python3
"""把逐格截圖 + 旁白 + 配樂合成宣傳短片。
用法：python3 build_promo.py <frames資料夾> <旁白wav資料夾(p01..p08.wav)> <輸出.mp4>
frames 資料夾內要有 capture.cjs 產生的 meta.json（含各段落開始時間）。"""
import json, subprocess, sys, os, tempfile
frames, voice, out = sys.argv[1:4]
meta = json.load(open(os.path.join(frames, 'meta.json')))
fps, n, marks = meta['fps'], meta['frames'], meta['marks']
dur = n / fps
tl = json.load(open(os.path.join(os.path.dirname(__file__), 'timeline.json')))
starts = [0.3, 3.4] + [marks[h['id']] + 0.35 for h in tl['halls']] + [marks['counts'] + 0.3, marks['outro'] + 0.3]
tmp = tempfile.mkdtemp()
music = os.path.join(tmp, 'music.wav')
subprocess.check_call([sys.executable, os.path.join(os.path.dirname(__file__), 'make_music.py'), music, str(dur + 1)])
cmd = ['ffmpeg', '-y', '-loglevel', 'error', '-framerate', str(fps), '-i', os.path.join(frames, '%05d.jpg'), '-i', music]
for i in range(8):
    cmd += ['-i', os.path.join(voice, 'p%02d.wav' % (i + 1))]
fc = []
for i, s in enumerate(starts):
    ms = int(s * 1000)
    fc.append(f'[{i+2}:a]aformat=sample_rates=44100:channel_layouts=stereo,adelay={ms}|{ms}[v{i}]')
fc.append(''.join(f'[v{i}]' for i in range(8)) + 'amix=inputs=8:normalize=0,volume=1.6,asplit=2[vo][sc]')
fc.append(f'[1:a]volume=0.55,atrim=0:{dur},asetpts=N/SR/TB[m]')
fc.append('[m][sc]sidechaincompress=threshold=0.02:ratio=9:attack=60:release=500[md]')
fc.append(f'[vo][md]amix=inputs=2:normalize=0,afade=t=out:st={dur-1.2}:d=1.2,alimiter=limit=0.95[a]')
cmd += ['-filter_complex', ';'.join(fc), '-map', '0:v', '-map', '[a]', '-t', str(dur),
        '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20', '-preset', 'veryfast', '-r', str(fps),
        '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', out]
subprocess.check_call(cmd)
print('ok', out, round(dur, 1), 's')
