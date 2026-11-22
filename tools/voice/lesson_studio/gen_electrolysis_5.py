"""electrolysis_5：從「有句尾標註」的稿子產生 scripts/electrolysis_5_script.txt 與 lessons/electrolysis_5.json。
標註：⟦A 分頁 步驟⟧＝該句開始時切到的畫面（at）；⟦C 比例 分頁 步驟⟧＝句中換畫面（acts）；⟦H 名稱⟧＝自動螢光筆（只供對照，實際在播放器 HLSPEC）。
分頁代號：i＝tab-intro、w＝tab-water、c＝tab-cuso4-c、u＝tab-cuso4-cu、p＝tab-plating。用法：python3 tools/voice/lesson_studio/gen_electrolysis_5.py
"""
import re, json, sys
import os
R=os.path.abspath(os.path.join(os.path.dirname(__file__),'../../..'))+'/'
SRC=R+'tools/voice/lesson_studio/scripts/electrolysis_5_annotated.txt'
TABS={'i':'tab-intro','w':'tab-water','c':'tab-cuso4-c','u':'tab-cuso4-cu','p':'tab-plating'}
out=[]; at={}; acts={}; chorus=[]; hl={}
n=0
for raw in open(SRC,encoding='utf-8'):
    raw=raw.rstrip('\n')
    if not raw.strip(): continue
    if raw.startswith('＊'):
        out.append(raw); continue
    m=re.search(r'\s*⟦(.+?)⟧\s*$',raw)
    body=raw[:m.start()] if m else raw
    n+=1
    out.append(body)
    if body.startswith('合聲'): chorus.append(n)
    if m:
        a=m.group(1).split()
        if a[0]=='A': at[str(n)]=[TABS[a[1]],None,int(a[2])]
        elif a[0]=='C': acts.setdefault(str(n),[]).append([float(a[1]),TABS[a[2]],None,int(a[3])])
        elif a[0]=='H': hl[str(n)]=a[1]
open(R+'tools/voice/lesson_studio/scripts/electrolysis_5_script.txt','w',encoding='utf-8').write('\n'.join(out)+'\n')
steps={'tab-intro':10,'tab-water':14,'tab-cuso4-c':9,'tab-cuso4-cu':9,'tab-plating':10}
cuts={'純水為什麼不導電？':['tab-intro',None],'水也能被電拆開？':['tab-water',None],'藍色為什麼變淡？':['tab-cuso4-c',None],'藍色為什麼不變？':['tab-cuso4-cu',None],'湯匙怎麼變銅色？':['tab-plating',None]}
cfg={"_note":"electrolysis_5：5 個分頁各一個動畫（步驟1～5，學生操作一次播一步）＋『動手做』實驗台（步驟6起＝實驗台狀態，照頁面原本的按鈕）。intro：6 初始(碳棒純水)、7 通電、8 糖水通電、9 氫氧化鈉通電、10 銅片氫氧化鈉通電。water：6 空桌、7 水槽、8 稀硫酸、9 碳棒近、10 試管裝水倒立、11 接導線完成、12 通電、13 檢驗負極端火柴、14 檢驗正極端木條。cuc：6 初始、7 預測變淡、8 通電、9 快轉。cucu：6 初始、7 碳碳通電快轉、8 銅銅、9 碳(負)銅(正)。plating：6 初始(錯誤接法)、7 純水通電、8 硫酸銅但湯匙接正極、9 三原則全對通電、10 取出沖洗。",
 "lesson":"electrolysis_5","page":"electrolysis_5.html","script":"tools/voice/lesson_studio/scripts/electrolysis_5_script.txt",
 "expect_lines":n,"expect_chorus":chorus,"cuts":cuts,"steps":steps,"at":at,"acts":acts}
json.dump(cfg,open(R+'tools/voice/lesson_studio/lessons/electrolysis_5.json','w',encoding='utf-8'),ensure_ascii=False,indent=1)
print('lines',n,'chorus',chorus,'hl',hl)
chars=sum(len(l.split('： ',1)[1]) for l in out if '： ' in l and not l.startswith('＊'))
print('chars',chars)
