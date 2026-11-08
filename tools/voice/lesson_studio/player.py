#!/usr/bin/env python3
"""課程試聽播放器（本機）

做法：開一個只有你自己連得到的本機網站（127.0.0.1）——
  - 課程頁面（例如 magnetism_1.html）直接讀你電腦上的 ~/Physical-Boys，不會修改它
  - 錄音讀 ~/Desktop/課程錄音/<課程名>/（manifest.json 和 mp3）
  - 播放器網頁是同資料夾的 player.html
音檔完全不進 git。
"""
import json
import mimetypes
import re
import sys
import threading
import webbrowser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlparse

HERE = Path(__file__).resolve().parent
HOME = Path.home()
REPO = Path(sys.argv[1]).expanduser() if len(sys.argv) > 1 else HOME / "Physical-Boys"
REC = Path(sys.argv[2]).expanduser() if len(sys.argv) > 2 else HOME / "Desktop" / "課程錄音"


def inside(p: Path, base: Path) -> bool:
    try:
        p.resolve().relative_to(base.resolve())
        return True
    except ValueError:
        return False


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *a, **k):
        super().__init__(*a, directory=str(REPO), **k)

    def log_message(self, *a):
        pass

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    # ── 送檔（支援 Range，Safari 播 mp3 需要） ──
    def send_file(self, p: Path):
        if not p.is_file():
            self.send_error(404)
            return
        size = p.stat().st_size
        ctype = mimetypes.guess_type(str(p))[0] or "application/octet-stream"
        if p.suffix == ".json":
            ctype = "application/json; charset=utf-8"
        start, end, code = 0, size - 1, 200
        m = re.match(r"bytes=(\d*)-(\d*)", self.headers.get("Range", ""))
        if m and (m.group(1) or m.group(2)):
            if m.group(1):
                start = int(m.group(1))
                if m.group(2):
                    end = min(int(m.group(2)), size - 1)
            else:
                start = max(0, size - int(m.group(2)))
            if start > end or start >= size:
                self.send_response(416)
                self.send_header("Content-Range", "bytes */%d" % size)
                self.end_headers()
                return
            code = 206
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Accept-Ranges", "bytes")
        self.send_header("Content-Length", str(end - start + 1))
        if code == 206:
            self.send_header("Content-Range", "bytes %d-%d/%d" % (start, end, size))
        self.end_headers()
        if self.command != "HEAD":
            with open(p, "rb") as f:
                f.seek(start)
                self.wfile.write(f.read(end - start + 1))

    def send_json(self, obj):
        body = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        host = self.headers.get("Host", "")
        if not (host.startswith("127.0.0.1") or host.startswith("localhost")):
            self.send_error(403)
            return
        path = unquote(urlparse(self.path).path)
        if path in ("/_p", "/_p/"):
            return self.send_file(HERE / "player.html")
        if path == "/_p/lessons":
            out = []
            if REC.exists():
                for d in REC.iterdir():
                    mf = d / "manifest.json"
                    if d.is_dir() and mf.exists():
                        try:
                            items = json.loads(mf.read_text("utf-8")).get("items", [])
                        except Exception:  # noqa: BLE001
                            continue
                        n = sum(1 for i in items if i.get("kind") == "line" and i.get("file"))
                        if n:
                            out.append({"name": d.name, "lines": n, "mtime": mf.stat().st_mtime})
            out.sort(key=lambda x: -x["mtime"])
            return self.send_json(out)
        if path.startswith("/_p/rec/"):
            p = REC / path[len("/_p/rec/"):]
            return self.send_file(p) if inside(p, REC) else self.send_error(403)
        if path.startswith("/_p/av/"):
            name = path[len("/_p/av/"):]
            p = HERE / "avatars" / name
            if not p.exists() and name == "yanjun.png":  # 沒有另外放頭像時，用 repo 裡的彥君老師素材
                p = REPO / "assets" / "characters" / "yanjun" / "pointer_board.png"
                return self.send_file(p)
            return self.send_file(p) if inside(p, HERE / "avatars") else self.send_error(403)
        return super().do_GET()


def main():
    if not (REPO / "magnetism_1.html").exists():
        sys.exit("找不到課程頁面資料夾：%s（可在指令後面加上資料夾路徑）" % REPO)
    server = None
    for port in range(8780, 8791):
        try:
            server = ThreadingHTTPServer(("127.0.0.1", port), Handler)
            break
        except OSError:
            continue
    if server is None:
        sys.exit("8780–8790 的連接埠都被佔用了，請先關掉其他程式再試。")
    url = "http://127.0.0.1:%d/_p/" % server.server_address[1]
    print("課程試聽播放器已啟動：%s\n關閉請在這個視窗按 Ctrl+C" % url)
    threading.Timer(0.6, lambda: webbrowser.open(url)).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n已關閉。")


if __name__ == "__main__":
    main()
