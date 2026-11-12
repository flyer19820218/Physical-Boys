"""字幕數字轉換：讀音稿寫國字，畫面字幕顯示阿拉伯數字（AGENTS_VOICE.md 第 5 節，老師 2026-11-12）。

只轉「量」，其餘一律不轉：
  ・數字後面接單位（牛頓、公尺、倍、伏特、歐姆…）；小數「一點五」→ 1.5
  ・題／個／種／隻／股 前面的數（「一」不轉：那一題、一個大輪）
  ・「第」後面的數字（第一題→第 1 題）
  ・百分之 N → N%；N 分之 M → M/N
  ・乘、除、等於 兩側緊鄰的數字（算式）；單獨的「一」只在句尾或後接單位才轉（避免「等於一開始」「除以一次匝數」被誤轉）
  ・「十的負十八次方」這類次方的指數
  ・帶分數「一又四分之一」→ 1 又 1/4；慣用語「下一秒、上一秒」不轉（PROTECT）
"""
import re

D = {"零": 0, "〇": 0, "一": 1, "二": 2, "兩": 2, "三": 3, "四": 4, "五": 5, "六": 6, "七": 7, "八": 8, "九": 9}
DIGCH = "零〇一二三四五六七八九"
NUMCH = "零〇一二兩三四五六七八九十百千萬"
NUM = "[" + NUMCH + "]+"
NUMD = "(?:%s)(?:點[%s]+)?" % (NUM, DIGCH)          # 整數或小數
UNITS = "公尺|公分|公里|公斤|公克|牛頓|焦耳|毫米|分鐘|秒|倍|瓦|伏|度|安|歐|匝|庫|赫|升|卡|單位"
UNITS_MULTI = "題|個|隻|股|種|件|句|組|步|條|顆|台|根|張|層"
OPS_L = "乘以|乘|除以|除|等於"                      # 數字「前面」的運算詞
OPS_R = "乘以|乘|除以|除|等於"                      # 數字「後面」的運算詞
END = "，。！？、；：」）"                           # 句內標點／結尾（單獨的「一」只在這些前面才轉）


def to_int(s):
    """國字轉整數（支援到千位）；轉不了回 None。"""
    if not s:
        return None
    if "萬" in s:
        l, _, r = s.partition("萬")
        lv = to_int(l) if l else 1
        rv = to_int(r) if r else 0
        return None if lv is None or rv is None else lv * 10000 + rv
    total, cur, seen = 0, 0, False
    for ch in s:
        if ch in D:
            cur = D[ch]; seen = True
        elif ch in "十百千":
            mul = {"十": 10, "百": 100, "千": 1000}[ch]
            if cur == 0:
                cur = 1
            total += cur * mul; cur = 0; seen = True
        else:
            return None
    return total + cur if seen else None


def val(s):
    """'一百二十'→'120'；'一點五'→'1.5'；'零點二四'→'0.24'；轉不了回 None。"""
    ip, _, fp = s.partition("點")
    n = to_int(ip)
    if n is None:
        return None
    if not fp:
        return str(n)
    if any(c not in D for c in fp):
        return None
    return "%d.%s" % (n, "".join(str(D[c]) for c in fp))


def _cv(m, g="n"):
    return val(m.group(g)) or m.group(g)


PROTECT = ("下一秒", "上一秒")                     # 慣用語（「預測下一秒」不是數量）：先換成佔位字、轉完再還原


def to_arabic(text):
    out = text
    for i, w in enumerate(PROTECT):
        out = out.replace(w, "\ue000%d\ue001" % i)
    # 0. 百分之 N → N%
    out = re.sub("百分之(?P<n>%s)" % NUMD, lambda m: (val(m.group("n")) + "%") if val(m.group("n")) else m.group(0), out)
    # 1. N 分之 M → M/N（整數）
    def frac(m):
        a, b = to_int(m.group(1)), to_int(m.group(2))
        return "%d/%d" % (b, a) if a and b is not None else m.group(0)
    out = re.sub("(%s)分之(%s)" % (NUM, NUM), frac, out)
    out = re.sub("(?P<n>%s)又(?=\\d+/\\d+)" % NUM, lambda m: (val(m.group("n")) or m.group("n")) + "又", out)   # 帶分數：一又 1/4 → 1 又 1/4
    # 2. 數字 + 單位
    out = re.sub("(?P<n>%s)(?=(?:%s))" % (NUMD, UNITS), _cv, out)
    # 3. 數字 + 題／個／隻／股／種（「一」不轉）
    out = re.sub("(?P<n>%s)(?=(?:%s))" % (NUMD, UNITS_MULTI), lambda m: m.group("n") if m.group("n") == "一" else _cv(m), out)
    # 4. 第 + 數字
    out = re.sub("(?<=第)(?P<n>%s)" % NUM, _cv, out)
    # 5. 運算詞前後的數字（單獨的「一」只在句尾標點前才轉；數字後接「次」不轉：一次／二次線圈）
    def op(m):
        n = m.group("n")
        return m.group("n") if n == "一" else _cv(m)
    def opl(m):
        n = m.group("n")
        return m.group("o") + (n if n == "一" else (val(n) or n))
    out = re.sub("(?P<o>%s)(?P<n>%s)(?![次開起下樣直定旦般些邊半])" % (OPS_L, NUMD), opl, out)
    out = re.sub("(?P<n>%s)(?=(?:%s))" % (NUMD, OPS_R), op, out)
    out = re.sub("(?P<o>%s)一(?=[%s]|$)" % (OPS_L, END), lambda m: m.group("o") + "1", out)
    # 5b. 加／減：兩側都是數字才轉（避免「加一點」）
    def addsub(m):
        return (val(m.group("a")) or m.group("a")) + m.group("o") + (val(m.group("b")) or m.group("b"))
    out = re.sub("(?P<a>%s|\\d+(?:\\.\\d+)?)(?P<o>加|減)(?P<b>%s)(?![次開起下樣直定旦般些邊半])" % (NUMD, NUMD), addsub, out)   # 前一個數字可能已被「等於」規則轉成阿拉伯數字
    # 5c. 算式結果：「是／為 + 數字」在句尾（單獨的「一」不轉）；次方底數；開根號
    def res(m):
        n = m.group("n")
        return m.group("o") + (n if n == "一" else (val(n) or n))
    out = re.sub("(?P<o>[是為])(?P<n>%s)(?=[%s]|$)" % (NUMD, END), res, out)
    out = re.sub("(?P<n>%s)(?=的(?:平方|立方))" % NUMD, _cv, out)
    out = re.sub("(?P<n>%s)(?=開根號)" % NUMD, _cv, out)
    out = re.sub("(?P<n>%s)(?=，(?:乘|除))" % NUMD, op, out)
    out = re.sub("(?P<o>從)(?P<n>%s)(?=變成)" % NUM, opl, out)
    out = re.sub("(?P<o>變成)(?P<n>%s)(?=[%s]|$)" % (NUMD, END), res, out)
    # 6. 次方的指數：十的負十八次方 → 10 的負 18 次方
    out = re.sub("(?<=的)(?P<m>負?)(?P<n>%s)(?=次方)" % NUM, lambda m: m.group("m") + (val(m.group("n")) or m.group("n")), out)
    # 7. 阿拉伯數字與中文字之間補空格（比照「N 極」）
    out = re.sub(r"(?<=[一-鿿])(?=\d)", " ", out)
    out = re.sub(r"(?<=\d)(?=[一-鿿])", " ", out)
    for i, w in enumerate(PROTECT):
        out = out.replace("\ue000%d\ue001" % i, w)
    return out
