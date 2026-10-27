#!/usr/bin/env python3
"""用「曉臻」(微軟 edge-tts：zh-TW-HsiaoChenNeural) 把台詞錄成 mp3。給 GitHub Actions 用，也能在有網路的電腦上手動跑。

用法：python3 tools/voice/render_voice.py <台詞檔> <輸出資料夾> [語速 +10%] [音調 +5Hz]
台詞檔：
  - .txt：一行一句（空行與 # 開頭的行略過），依序錄成 01.mp3、02.mp3…
  - .json：伽利略星球開場白的 assets/museum/audio/intro_lines.json，用每句的 tts 欄位，檔名用 id
"""
import asyncio, json, os, sys

VOICE = 'zh-TW-HsiaoChenNeural'


def load(src):
    if src.endswith('.json'):
        return [(l['id'], l['tts']) for l in json.load(open(src, encoding='utf-8'))['lines']]
    rows = [l.strip() for l in open(src, encoding='utf-8')]
    rows = [l for l in rows if l and not l.startswith('#')]
    return [('%02d' % (i + 1), t) for i, t in enumerate(rows)]


async def render(i, text, out, rate, pitch):
    import edge_tts
    path = os.path.join(out, i + '.mp3')
    last = None
    for k in range(5):
        try:
            await edge_tts.Communicate(text, VOICE, rate=rate, pitch=pitch).save(path)
            if os.path.getsize(path) > 1000:
                print('OK', i, text)
                return
            last = RuntimeError('檔案太小，可能是空的')
        except Exception as e:  # 網路抖動、被限流：等一下再試
            last = e
        print('retry', i, k + 1, last)
        await asyncio.sleep(3 * (k + 1))
    sys.exit('錄不起來：%s %s（%s）' % (i, text, last))


async def main():
    if len(sys.argv) < 3:
        sys.exit(__doc__)
    src, out = sys.argv[1], sys.argv[2]
    rate = sys.argv[3] if len(sys.argv) > 3 else '+10%'
    pitch = sys.argv[4] if len(sys.argv) > 4 else '+5Hz'
    os.makedirs(out, exist_ok=True)
    rows = load(src)
    if not rows:
        sys.exit('台詞檔是空的：' + src)
    for i, text in rows:  # 一句一句錄，比較不會被限流
        await render(i, text, out, rate, pitch)
    print('全部完成：%d 句 → %s' % (len(rows), out))


asyncio.run(main())
