#!/usr/bin/env python3
"""產生「雙擊就錄曉臻」的 Mac 小工具（.command 包在 .zip 裡，解壓後保留可執行權限）。
用法：python3 tools/voice/make_xiaozhen_tool.py <台詞.txt> <工具名稱> [語速 +10%] [音調 +5Hz]
台詞.txt：一行一句，會依序錄成 01.mp3、02.mp3…；錄好的檔案放在老師桌面的「<工具名稱>」資料夾。
產出：tools/voice/<工具名稱>.zip（傳給老師），以及同名 .command。"""
import sys, os, json, zipfile, stat
src, name = sys.argv[1], sys.argv[2]
rate = sys.argv[3] if len(sys.argv) > 3 else '+10%'
pitch = sys.argv[4] if len(sys.argv) > 4 else '+5Hz'
lines = [l.strip() for l in open(src, encoding='utf-8') if l.strip()]
here = os.path.dirname(os.path.abspath(__file__))
tpl = open(os.path.join(here, 'xiaozhen_template.command'), encoding='utf-8').read()
body = (tpl.replace('__OUTNAME__', name).replace('__RATE__', rate).replace('__PITCH__', pitch)
        .replace('__LINES__', json.dumps([['%02d' % (i + 1), t] for i, t in enumerate(lines)], ensure_ascii=False)))
cmd = os.path.join(here, name + '.command')
open(cmd, 'w', encoding='utf-8').write(body)
os.chmod(cmd, 0o755)
zp = os.path.join(here, name + '.zip')
with zipfile.ZipFile(zp, 'w', zipfile.ZIP_DEFLATED) as z:
    info = zipfile.ZipInfo(name + '.command')
    info.external_attr = (stat.S_IFREG | 0o755) << 16
    info.compress_type = zipfile.ZIP_DEFLATED
    z.writestr(info, body)
print('ok', zp, len(lines), '句')
