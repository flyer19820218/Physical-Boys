#!/usr/bin/env python3
"""把 BreezyVoice 錄好的開場旁白（01.wav～08.wav）接成網頁用的一個檔，並算好字幕時間。

用法（在專案根目錄）：
    python3 tools/museum/build_narration.py <放 wav 的資料夾>

讀：assets/museum/audio/intro_lines.json（台詞、字幕、角色）
寫：assets/museum/audio/intro_zh.mp3（單聲道 96 kbps）與 intro_zh.json（每句的開始／結束秒數）

時間怎麼排（和 scene.js 的開場飛行配合）：
  - 登機的兩句接著念（中間停 0.35 秒）
  - 「太空梭目前正穿越蟲洞」那一刻畫面切進蟲洞隧道，至少停 6.0 秒（螺旋 5.25 秒＋穿過隧道 0.75 秒）
  - 「穿越成功」那一刻閃光、太空梭開始飛（飛行 5.6 秒）
  - 飛行中那句緊接在「穿越成功」後面
  - （舊版的「三、二、一、出發」role=count 仍可處理，每 1 秒一拍）
  - 抵達那句：等飛行結束（或上一句念完）才開始
每句的頭尾空白會先剪掉，音量用 loudnorm 統一。
"""
import json
import os
import shutil
import subprocess
import sys
import tempfile

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
AUD = os.path.join(ROOT, 'assets', 'museum', 'audio')
FLIGHT = 5.6  # 與 scene.js 的 INTRO.dur（毫秒）一致
WARP_MIN = 6.0  # 蟲洞段最短秒數（與 launch.js 的 WARP_MS 一致）：螺旋 5.25 秒＋穿過隧道 0.75 秒


def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        sys.exit('ffmpeg 失敗：\n' + ' '.join(cmd) + '\n' + r.stderr[-2000:])


def duration(path):
    r = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', path], capture_output=True, text=True)
    return float(r.stdout.strip())


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    src = sys.argv[1]
    lines = json.load(open(os.path.join(AUD, 'intro_lines.json'), encoding='utf-8'))['lines']
    tmp = tempfile.mkdtemp()
    try:
        clips = []
        for ln in lines:
            f = os.path.join(src, ln['id'] + '.wav')
            if not os.path.exists(f):
                sys.exit('找不到 ' + f)
            o = os.path.join(tmp, ln['id'] + '.wav')
            trim = 'silenceremove=start_periods=1:start_threshold=-42dB:start_silence=0.03'
            run(['ffmpeg', '-y', '-i', f, '-af', trim + ',areverse,' + trim + ',areverse', '-ac', '1', '-ar', '44100', o])
            clips.append((ln, o, duration(o)))

        cues, prev_end, beat, launch_at, warp_at = [], 0.0, None, None, None
        for ln, o, d in clips:
            role = ln['role']
            if role == 'board':
                start = 0.3 if not cues else prev_end + 0.35
            elif role == 'wormhole':
                start = prev_end + 0.6
                warp_at = start
            elif role == 'launch' and warp_at is not None:
                start = max(warp_at + WARP_MIN, prev_end + 0.5)
                launch_at = start
            elif role in ('count', 'launch'):
                start = prev_end + 0.6 if beat is None else max(beat + 1.0, prev_end + 0.12)
                beat = start
                if role == 'launch':
                    launch_at = start
            elif role == 'flight':
                start = prev_end + 0.25
            elif role == 'arrive':
                start = max(prev_end + 0.45, (launch_at or 0) + FLIGHT + 0.3)
            else:
                start = prev_end + 0.35
            cues.append({'id': ln['id'], 'role': role, 'sub': ln['sub'], 'start': round(start, 3), 'end': round(start + d, 3)})
            prev_end = start + d

        inputs, chains = [], []
        for i, (ln, o, d) in enumerate(clips):
            inputs += ['-i', o]
            chains.append('[%d:a]adelay=%d:all=1[a%d]' % (i, int(round(cues[i]['start'] * 1000)), i))
        mix = ''.join('[a%d]' % i for i in range(len(clips)))
        mix += 'amix=inputs=%d:normalize=0:duration=longest,loudnorm=I=-16:TP=-1.5:LRA=11,apad=pad_dur=0.3[out]' % len(clips)
        mp3 = os.path.join(AUD, 'intro_zh.mp3')
        run(['ffmpeg', '-y', *inputs, '-filter_complex', ';'.join(chains + [mix]), '-map', '[out]', '-ac', '1', '-ar', '44100', '-c:a', 'libmp3lame', '-b:a', '96k', mp3])
        out = {
            'note': '由 tools/museum/build_narration.py 產生，請勿手改。start／end 單位是秒。',
            'flight': FLIGHT,
            'duration': round(prev_end, 3),
            'lines': cues,
        }
        with open(os.path.join(AUD, 'intro_zh.json'), 'w', encoding='utf-8') as fh:
            json.dump(out, fh, ensure_ascii=False, indent=1)
            fh.write('\n')
        for c in cues:
            print('%s  %6.2f → %6.2f  %-6s %s' % (c['id'], c['start'], c['end'], c['role'], c['sub']))
        print('總長 %.2f 秒；%s（%d KB）' % (prev_end, os.path.relpath(mp3, ROOT), os.path.getsize(mp3) // 1024))
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


if __name__ == '__main__':
    main()
