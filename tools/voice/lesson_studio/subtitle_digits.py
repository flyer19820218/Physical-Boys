"""字幕數字轉換：讀音稿寫國字，畫面字幕顯示阿拉伯數字（AGENTS_VOICE.md 第 5 節，老師 2026-11-12）。

只轉「量」：
  ・數字後面接單位（牛頓、公尺、倍…）
  ・「第」後面的數字（第一題→第 1 題）
  ・「N 分之 M」→ M/N
  ・乘、除、等於、加、減 兩側緊鄰的數字（算式）
其餘（一點、一定、同一招、一個…）一律不轉。
"""
import re

D = {"零": 0, "〇": 0, "一": 1, "二": 2, "兩": 2, "三": 3, "四": 4, "五": 5, "六": 6, "七": 7, "八": 8, "九": 9}
NUMCH = "零〇一二兩三四五六七八九十百千"
NUM = "[" + NUMCH + "]+"
UNITS = "公尺|公分|公里|公斤|公克|牛頓|焦耳|毫米|分鐘|倍|瓦|伏|度"
UNITS_MULTI = "題|個|隻|股|種"   # 「一」不轉（一個、那一題、這一種都是口語），兩個以上才轉
OPS_L = "乘以|乘|除以|除|等於"          # 數字「前面」的運算詞
OPS_R = "乘以|乘|除以|除"               # 數字「後面」的運算詞（等於在右邊時左邊是算式的一部分）


def to_int(s):
    """國字轉整數（支援到千位）；轉不了回 None。"""
    if not s:
        return None
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


def _num(s):
    n = to_int(s)
    return None if n is None else str(n)


def to_arabic(text):
    out = text
    # 0. 百分之 M → M%
    out = re.sub("百分之(%s)" % NUM, lambda m: (_num(m.group(1)) + "%") if _num(m.group(1)) else m.group(0), out)
    # 1. N 分之 M → M/N
    def frac(m):
        a, b = _num(m.group(1)), _num(m.group(2))
        return "%s/%s" % (b, a) if a and b else m.group(0)
    out = re.sub("(%s)分之(%s)" % (NUM, NUM), frac, out)

    def rep(m):
        n = _num(m.group(2))
        return m.group(1) + (n if n else m.group(2)) + m.group(3)

    # 2. 數字 + 單位
    out = re.sub("()(%s)(?=(?:%s))" % (NUM, UNITS), lambda m: _num(m.group(2)) or m.group(2), out)
    def multi(m):
        return m.group(2) if m.group(2) == "一" else (_num(m.group(2)) or m.group(2))
    out = re.sub("()(%s)(?=(?:%s))" % (NUM, UNITS_MULTI), multi, out)
    # 3. 第 + 數字
    out = re.sub("(第)(%s)()" % NUM, rep, out)
    # 4. 運算詞前後的數字
    out = re.sub("((?:%s))(%s)()" % (OPS_L, NUM), rep, out)
    out = re.sub("()(%s)((?:%s))" % (NUM, OPS_R), rep, out)
    out = re.sub("()(%s)(等於)" % NUM, rep, out)
    # 5. 阿拉伯數字與中文字之間補空格（比照「N 極」）
    out = re.sub(r"(?<=[\u4e00-\u9fff])(?=\d)", " ", out)
    out = re.sub(r"(?<=\d)(?=[一-鿿])", " ", out)
    return out
