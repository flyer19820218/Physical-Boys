#!/usr/bin/env python3
"""把 140 個課程 html 轉成「一課一檔」的 markdown，只留中文講解文字。

為什麼：寫雙人對話稿（AGENTS_VOICE.md）時，AI 只讀這一課的 markdown（幾千字），
不用讀整份 html（動輒 9 萬字元）。轉換是本機程式，不耗 token。

用法（在 repo 根目錄）：
    python3 tools/voice/lesson_md/convert_lessons.py            # 全部 140 課 → lessons_md/
    python3 tools/voice/lesson_md/convert_lessons.py magnetism_1 magnetism_2   # 只轉指定幾課
    python3 tools/voice/lesson_md/convert_lessons.py --out 別的資料夾

輸出：
    lessons_md/<課名>.md   每課一檔（館、單元、分頁／子頁編號、講解文字、互動說明、提示框）
    lessons_md/INDEX.md    140 課總表（先讀這個找到課，再讀該課的 md）
課程網頁一改就重跑一次。檔案是自動產生的，不要手改。
"""
import argparse
import re
import sys
from pathlib import Path

from bs4 import BeautifulSoup, Comment, NavigableString

ROOT = Path(__file__).resolve().parents[3]

CJK = re.compile(r"[\u4e00-\u9fff]")
SKIP_TAGS = {"script", "style", "noscript", "template", "svg", "canvas", "button", "input", "select",
             "textarea", "option", "audio", "video", "iframe", "head", "link", "meta"}
# 介面雜訊（語言切換、學生／老師模式列、老師講解的暫停重播鈕等）
SKIP_CLASS_PREFIX = ("lang-", "mode-", "teach-", "toast", "back-", "float")
SKIP_CLASS_EXACT = {"lang", "lang-label", "lang-pill", "mode-hint", "nav", "navbar", "toolbar", "step-dots",
                    "teach-bar", "teach-btns", "sr-only"}
BLOCK = {"div", "p", "section", "article", "ul", "ol", "li", "table", "tr", "td", "th", "thead", "tbody",
         "h1", "h2", "h3", "h4", "h5", "h6", "figure", "figcaption", "blockquote", "details", "summary",
         "header", "footer", "main", "aside", "nav", "dl", "dt", "dd", "form", "fieldset", "pre", "hr", "label"}
CALLOUT = ("key-box", "hook-text", "result-box", "note", "tip", "warn", "callout", "answer", "reveal",
           "hint", "fact", "box")
SUBS = str.maketrans("0123456789+-=()", "₀₁₂₃₄₅₆₇₈₉₊₋₌₍₎")
SUPS = str.maketrans("0123456789+-=()n", "⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻⁼⁽⁾ⁿ")


def classes(el):
    c = el.get("class") or []
    return c if isinstance(c, list) else str(c).split()


def skipped(el):
    if el.name in SKIP_TAGS:
        return True
    if el.has_attr("hidden") and el.name in ("template",):
        return True
    for c in classes(el):
        if c in SKIP_CLASS_EXACT or c.startswith(SKIP_CLASS_PREFIX):
            return True
    return False


def norm(t):
    return re.sub(r"[ \t\r\n ]+", " ", t).strip()


def sub_text(t):
    t = t.strip()
    return t.translate(SUBS) if re.fullmatch(r"[0-9+\-=()]+", t) else "_(" + t + ")"


def sup_text(t):
    t = t.strip()
    return t.translate(SUPS) if re.fullmatch(r"[0-9+\-=()n]+", t) else "^(" + t + ")"


def inline(node):
    """一個元素裡的行內文字（粗體保留成 **；上下標轉成 Unicode）。"""
    out = []
    for c in node.children:
        if isinstance(c, Comment):
            continue
        if isinstance(c, NavigableString):
            out.append(str(c))
            continue
        if skipped(c):
            continue
        n = c.name
        if c.has_attr("data-zh") and n not in ("br",):
            out.append(inline(BeautifulSoup("<x>" + c["data-zh"] + "</x>", "lxml").x))
        elif n == "br":
            out.append(" ")
        elif n in ("strong", "b"):
            t = norm(inline(c))
            out.append("**" + t + "**" if t else "")
        elif n in ("em", "i"):
            t = norm(inline(c))
            out.append("*" + t + "*" if t else "")
        elif n == "sub":
            out.append(sub_text(inline(c)))
        elif n == "sup":
            out.append(sup_text(inline(c)))
        elif n == "img":
            alt = norm(c.get("alt") or "")
            if alt:
                out.append("［圖：" + alt + "］")
        else:
            out.append(inline(c))
    return "".join(out)


def text_of(el):
    """元素的中文文字：優先看實際內容，空的話改用 data-zh（有些頁面由腳本填入）。"""
    t = norm(inline(el))
    if not t and el.has_attr("data-zh"):
        t = norm(inline(BeautifulSoup("<x>" + el["data-zh"] + "</x>", "lxml").x))
    return t


class Converter:
    def __init__(self, soup):
        self.soup = soup
        self.lines = []
        self.nav = self.collect_nav()
        self.used = set()
        self.in_callout = False

    # ── 分頁／子頁：由按鈕找出面板 id 與名稱 ──
    def collect_nav(self):
        ids = {e["id"] for e in self.soup.find_all(id=True)}
        nav = {}
        for b in self.soup.find_all(True):
            if skipped_nav(b):
                continue
            cls = " ".join(classes(b))
            is_tab = "tab" in cls or b.get("role") == "tab"
            targets = []
            for attr in ("data-tab", "data-sub", "data-target", "data-panel", "data-page"):
                if b.has_attr(attr):
                    targets.append((attr, b[attr]))
            if is_tab and b.has_attr("onclick"):
                for q in re.findall(r"['\"]([\w\-]+)['\"]", b["onclick"]):
                    if q in ids:
                        targets.append(("onclick", q))
            for attr, tid in targets:
                if tid in ids and tid not in nav:
                    nav[tid] = {"label": nav_label(b), "sub": ("sub" in cls) or attr == "data-sub"}
        return nav

    def heading_for(self, el):
        info = self.nav.get(el.get("id"))
        if not info or el.get("id") in self.used:
            return None
        self.used.add(el["id"])
        if info["sub"]:
            return "### 子頁：%s `[%s]`" % (info["label"], el["id"])
        return "## 分頁：%s `[%s]`" % (info["label"], el["id"])

    # ── 走訪 ──
    def run(self):
        body = self.soup.body or self.soup
        self.walk(body, self.lines)
        return self.lines

    def walk(self, node, out):
        buf = []

        def flush():
            t = norm("".join(buf))
            buf.clear()
            if t:
                out.append(t)

        for c in node.children:
            if isinstance(c, Comment):
                continue
            if isinstance(c, NavigableString):
                buf.append(str(c))
                continue
            if c.name == "button" and not skipped_nav(c):
                t = text_of(c)
                if len(CJK.findall(t)) >= 6:
                    flush()
                    out.append("- ［按鈕］" + t)
                continue
            if skipped(c):
                continue
            if c.name in BLOCK or self.heading_for_peek(c):
                flush()
                self.block(c, out)
            else:
                buf.append(inline(c) if c.name != "br" else " ")
        flush()

    def heading_for_peek(self, el):
        return el.get("id") in self.nav and el.get("id") not in self.used

    def block(self, el, out):
        h = self.heading_for(el)
        if h:
            out.append("")
            out.append(h)
        n = el.name
        if n in ("h1", "h2", "h3", "h4", "h5", "h6"):
            t = text_of(el)
            if t:
                out.append("")
                out.append(("# " if n == "h1" else "#### " if n in ("h2", "h3") else "##### ") + t)
        elif n in ("ul", "ol"):
            self.list_block(el, out, 0)
        elif n == "table":
            self.table_block(el, out)
        elif n == "figcaption":
            t = text_of(el)
            if t:
                out.append("*" + t + "*")
        elif n == "hr":
            pass
        elif any(c in classes(el) for c in CALLOUT) or any(
                k in " ".join(classes(el)) for k in ("key-box", "hook-", "result-box")):
            if self.in_callout:
                self.walk(el, out)
                return
            self.in_callout = True
            tmp = []
            self.walk(el, tmp)
            self.in_callout = False
            tmp = [x for x in tmp if x.strip()]
            if tmp:
                out.append("")
                out.extend("> " + (x.lstrip("# ") if x.startswith("#") else x) for x in tmp)
        else:
            self.walk(el, out)

    def list_block(self, el, out, depth):
        for li in el.find_all(["li"], recursive=False):
            nested = [c for c in li.children if getattr(c, "name", None) in ("ul", "ol")]
            parts = []
            for c in li.children:
                if isinstance(c, Comment) or (getattr(c, "name", None) in ("ul", "ol")):
                    continue
                if isinstance(c, NavigableString):
                    parts.append(str(c))
                elif not skipped(c):
                    parts.append(inline(c) if c.name != "br" else " ")
            t = norm("".join(parts))
            if t:
                out.append("  " * depth + "- " + t)
            for n in nested:
                self.list_block(n, out, depth + 1)

    def table_block(self, el, out):
        rows = []
        for tr in el.find_all("tr"):
            cells = [norm(inline(td)).replace("|", "／") for td in tr.find_all(["th", "td"])]
            if any(cells):
                rows.append(cells)
        if not rows:
            return
        w = max(len(r) for r in rows)
        rows = [r + [""] * (w - len(r)) for r in rows]
        out.append("")
        out.append("| " + " | ".join(rows[0]) + " |")
        out.append("|" + "---|" * w)
        for r in rows[1:]:
            out.append("| " + " | ".join(r) + " |")
        out.append("")


def skipped_nav(b):
    # 導覽按鈕本身在 SKIP_TAGS（button），所以另外判斷：只排除語言／模式列
    for c in classes(b):
        if c in SKIP_CLASS_EXACT or c.startswith(("lang-", "mode-", "teach-")):
            return True
    return False


def nav_label(b):
    main = b.find(class_=re.compile(r"tab-main"))
    sub = b.find(class_=re.compile(r"tab-sub"))
    if main and sub:
        return "%s（%s）" % (norm(inline(main)), norm(inline(sub)))
    t = norm(b.get_text(" "))
    return t or b.get("data-zh") or "?"


# ── index_classic.html：館／單元／課名 ──
def read_index():
    s = BeautifulSoup((ROOT / "index_classic.html").read_text("utf-8"), "lxml")
    halls = {}
    for b in s.find_all("button", onclick=re.compile(r"switchSubject")):
        m = re.search(r"switchSubject\(\s*['\"](\w+)['\"]", b["onclick"])
        if m:
            halls[m.group(1)] = re.sub(r"^[^\u4e00-\u9fffA-Za-z]+", "", norm(b.get_text(" ")).replace("🌱", "").replace("🔬", "").replace("🍎", "").replace("⚡", "").replace("🧪", "").replace("⚗️", "").replace("🌍", "").replace("🔭", "")).strip()
    lessons = []
    for hall in s.select("div.subject-section"):
        hid = hall.get("id", "")
        for sec in hall.select("section.category"):
            h2 = sec.find("h2")
            unit = norm(h2.get_text(" ")) if h2 else ""
            cards = sec.select("a.card")
            for i, a in enumerate(cards, 1):
                href = (a.get("href") or "").split("?")[0]
                if not href.endswith(".html"):
                    continue
                title = a.select_one(".card-title")
                subt = a.select_one(".card-sub")
                lessons.append({
                    "file": href, "name": href[:-5], "hall_id": hid, "hall": halls.get(hid, hid),
                    "unit": unit, "no": i, "of": len(cards),
                    "title": norm(title.get_text(" ")) if title else href,
                    "sub": norm(subt.get_text(" ")) if subt else "",
                })
    return lessons



CJK = re.compile(r"[一-鿿]")
JS_ESC = {"n": " ", "t": " ", "r": " ", "'": "'", '"': '"', "`": "`", "\\": "\\", "/": "/"}


def js_unescape(t):
    t = re.sub(r"\\u([0-9a-fA-F]{4})", lambda m: chr(int(m.group(1), 16)), t)
    t = re.sub(r"\\x([0-9a-fA-F]{2})", lambda m: chr(int(m.group(1), 16)), t)
    return re.sub(r"\\(.)", lambda m: JS_ESC.get(m.group(1), m.group(1)), t)


def js_strings(src):
    """從 JavaScript 原始碼取出所有字串（略過註解與正規表示式），回傳含中文的那些。"""
    out, i, n, prev = [], 0, len(src), ""
    while i < n:
        c = src[i]
        nx = src[i + 1] if i + 1 < n else ""
        if c == "/" and nx == "/":
            j = src.find("\n", i)
            i = n if j < 0 else j
        elif c == "/" and nx == "*":
            j = src.find("*/", i + 2)
            i = n if j < 0 else j + 2
        elif c == "/" and (prev == "" or prev in "(,=:[!&|?{};+-*%<>~^"):
            j, incls = i + 1, False
            while j < n:
                ch = src[j]
                if ch == "\\":
                    j += 2
                    continue
                if ch == "[":
                    incls = True
                elif ch == "]":
                    incls = False
                elif ch == "/" and not incls:
                    break
                elif ch == "\n":
                    break
                j += 1
            i, prev = j + 1, ")"
        elif c in "'\"":
            j, buf = i + 1, []
            while j < n and src[j] != c and src[j] != "\n":
                if src[j] == "\\" and j + 1 < n:
                    buf.append(src[j:j + 2])
                    j += 2
                else:
                    buf.append(src[j])
                    j += 1
            out.append(js_unescape("".join(buf)))
            i, prev = j + 1, c
        elif c == "`":
            j, buf = i + 1, []
            while j < n and src[j] != "`":
                if src[j] == "\\" and j + 1 < n:
                    buf.append(src[j:j + 2])
                    j += 2
                elif src[j:j + 2] == "${":
                    d, j = 1, j + 2
                    while j < n and d > 0:
                        d += (src[j] == "{") - (src[j] == "}")
                        j += 1
                    buf.append("…")
                else:
                    buf.append(src[j])
                    j += 1
            out.append(js_unescape("".join(buf)))
            i, prev = j + 1, "`"
        else:
            if not c.isspace():
                prev = c
            i += 1
    return [norm(t) for t in out if CJK.search(t)]


CODEISH = re.compile(r"=>|\bfunction\b|\bpx\b|^[.#/<]|\.(js|css|png|jpg|svg)\b|\$\{")
BRACEISH = re.compile(r"[{};]")  # 只有「短字串」才用它判斷是不是程式碼；長句（常含 LaTeX 如 \\frac{1}{2}）一律保留


def text_block(strings, seen):
    """長句成條列，短詞（標籤、按鈕字）合成一行；依第一次出現的順序，不重複。"""
    longs, shorts = [], []
    for t in strings:
        if re.search(r"</?[a-zA-Z][^>]*>", t):  # 字串裡帶 HTML（<b>、<sub>…）：轉成一般文字
            t = norm(inline(BeautifulSoup("<x>" + t + "</x>", "lxml").x))
        n = len(CJK.findall(t))
        if t in seen or CODEISH.search(t) or (n < 10 and BRACEISH.search(t)):
            continue
        seen.add(t)
        if n >= 10 or re.search(r"[，。？！；：]", t):
            longs.append("- " + t)
        else:
            shorts.append(t)
    lines = longs[:]
    if shorts:
        lines.append("")
        lines.append("短詞／標籤：" + "｜".join(shorts))
    return lines


def script_usage():
    """每個外部腳本被幾課引用——被很多課引用的是共用程式庫，不含這一課的講解。"""
    use = {}
    for l in read_index():
        t = (ROOT / l["file"]).read_text("utf-8")
        for src in set(re.findall(r"<script[^>]+src=[\"']([^\"'?#]+)", t)):
            use[src] = use.get(src, 0) + 1
    return use


def script_sections(lesson, usage, seen):
    """回傳 (腳本講解文字, 既有老師講解腳本, 題庫) 三段的行。"""
    html = (ROOT / lesson["file"]).read_text("utf-8")
    soup = BeautifulSoup(html, "lxml")
    main, teach, quiz = [], [], []
    inline_src = "\n".join(x.get_text() for x in soup.find_all("script") if not x.get("src"))
    blk = text_block(js_strings(inline_src), seen)
    if blk:
        main += ["### 頁內腳本", ""] + blk + [""]
    for x in soup.find_all("script", src=True):
        src = x["src"].split("?")[0].split("#")[0]
        path = ROOT / src
        if not path.exists() or usage.get(src, 0) >= 7:
            continue
        name = path.name
        if "pen_tool" in name or "mcq_tabs" in name or "lesson_quiz_static" in name:
            continue
        strs = js_strings(path.read_text("utf-8", errors="ignore"))
        b = text_block(strs, seen)
        if not b:
            continue
        target = quiz if "quiz" in name else teach if "teach" in name else main
        target += ["### `%s`" % src, ""] + b + [""]
    return main, teach, quiz


def convert(lesson, usage):
    path = ROOT / lesson["file"]
    soup = BeautifulSoup(path.read_text("utf-8"), "lxml")
    for t in soup(["script", "style", "noscript", "template"]):
        t.decompose()
    conv = Converter(soup)
    lines = conv.run()
    # 整理：去掉連續空行與重複的相鄰行
    out, prev = [], None
    for ln in lines:
        if ln == prev and ln.strip():
            continue
        if not ln.strip() and (not out or not out[-1].strip()):
            continue
        out.append(ln)
        prev = ln
    body = "\n".join(out).strip()
    head = [
        "# %s（%s）" % (lesson["title"], lesson["name"]),
        "",
        "> 館：%s　單元：%s　課序：%d／%d　檔案：`%s`" % (lesson["hall"], lesson["unit"], lesson["no"], lesson["of"], lesson["file"]),
        "> 簡介：%s" % lesson["sub"],
        "> 自動產生（`tools/voice/lesson_md/convert_lessons.py`），請勿手改；課程網頁改了再重跑。分頁／子頁後面的 `[id]` 對應網頁的 `data-tab`／`data-sub`。",
        "",
    ]
    body = re.sub(r"^# .*\n?", "", body, count=1) if body.startswith("# ") else body
    seen = set()
    main, teach, quiz = script_sections(lesson, usage, seen)
    extra = []
    if main:
        extra += ["", "## 腳本裡的講解文字（動畫、畫布、任務說明）", "",
                  "> 這些文字不在網頁上，而是由 JavaScript 畫出或填入；依出現順序列出，句子在前、短詞標籤在後。", ""] + main
    if teach:
        extra += ["", "## 既有「老師講解」腳本的文字", "",
                  "> 現有自動播放講解用的文字，寫對話稿時可參考，避免和它矛盾。", ""] + teach
    body = (body + "\n" + "\n".join(extra)).strip()
    text = "\n".join(head) + "\n" + body + "\n"
    quiz_text = None
    if quiz:
        quiz_text = "\n".join(["# %s（%s）題庫" % (lesson["title"], lesson["name"]), "",
                               "> 自動產生，只供參考，不是講解內容。對應講解檔：`%s.md`。" % lesson["name"], ""] + quiz).strip() + "\n"
    cjk = len(re.findall(r"[一-鿿]", body))
    return text, quiz_text, {"chars": cjk, "quiz_chars": len(CJK.findall(quiz_text or "")), "tabs": sum(1 for i in conv.used if not conv.nav[i]["sub"]),
                  "subs": sum(1 for i in conv.used if conv.nav[i]["sub"]),
                  "nav_unused": len(set(conv.nav) - conv.used)}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("names", nargs="*")
    ap.add_argument("--out", default="lessons_md")
    a = ap.parse_args()
    lessons = read_index()
    if a.names:
        lessons = [l for l in lessons if l["name"] in a.names]
    outdir = ROOT / a.out
    outdir.mkdir(parents=True, exist_ok=True)
    rows = []
    usage = script_usage()
    for l in lessons:
        text, quiz_text, st = convert(l, usage)
        (outdir / (l["name"] + ".md")).write_text(text, "utf-8")
        if quiz_text:
            (outdir / (l["name"] + ".quiz.md")).write_text(quiz_text, "utf-8")
        rows.append((l, st))
    if not a.names:
        idx = ["# 140 課總表（自動產生）", "",
               "寫稿時：先在這裡找到課，再只讀 `lessons_md/<課名>.md`。「中文字數」是講解文字的量。", "",
               "| 館 | 單元 | 課 | 檔名 | 中文字數 | 分頁 | 子頁 | 題庫字數 |", "|---|---|---|---|---|---|---|---|"]
        for l, st in rows:
            idx.append("| %s | %s | %s | [%s](%s.md) | %d | %d | %d | %d |" % (
                l["hall"], l["unit"], l["title"], l["name"], l["name"], st["chars"], st["tabs"], st["subs"], st["quiz_chars"]))
        (outdir / "INDEX.md").write_text("\n".join(idx) + "\n", "utf-8")
    print("轉好 %d 課 → %s" % (len(rows), outdir))
    return rows


if __name__ == "__main__":
    main()
