# magnetism_1 stage 規格

由 `tools/voice/lesson_studio/build_lesson.py` 從稿子自動產生，請改稿子或腳本，不要手改 `stage.json`。

- `page`：課程頁 `magnetism_1.html`。
- `cuts`：播到 `＊切頁：<標題>` 時，點 `.tab-button[data-tab=tab]`，再點 `.sub-tab-btn[data-sub=sub]`。標題必須與稿子完全一致（共 5 個）。
- `at`：播到第 N 句（說話行編號，兩位數，與 manifest 的 `id` 相同）時，切到指定 tab／sub（共 33 個）。
- `subs`：該句的字幕顯示字。只放字幕和念的字不同的句子：N 極／S 極（恩極→N 極、艾斯極→S 極）與國字數字轉阿拉伯數字（五十牛頓→50 牛頓），其餘字不變；`pins` 是釘選黃條同樣的轉換（共 52 句）。沒列在 `subs` 的句子，字幕直接顯示 `text`。

句號有兩種寫法，不要混用：`id`／`stage.json` 的 key 是兩位數（01–106）；音檔檔名是三位數（`001_yanjun.mp3`–`106_...`），說話者對應 彥君=yanjun、曉臻=xiaozhen、合聲=hesheng。

## cuts

- 用吸管喝飲料，真的是嘴巴把它「吸」上來的嗎？ → `tab1` / `straw`
- 玻璃管倒插在水銀槽裡，水銀為什麼不會全部流光？ → `tab2` / `torr`
- 不能熔化皇冠，怎麼知道它是不是純金？ → `tab3` / `crown`
- 大船從海裡開進淡水河，為什麼會往下沉一點？ → `tab4` / `sinkfloat`
- 冰塊融化後，杯子裡的水面會升、會降，還是不變？ → `tab5` / `ice`

## at

- 第 12 句 → `tab1` / `straw`
- 第 14 句 → `tab1` / `straw`
- 第 17 句 → `tab1` / `straw`
- 第 20 句 → `tab1` / `magde`
- 第 34 句 → `tab2` / `torr`
- 第 37 句 → `tab2` / `torr`
- 第 40 句 → `tab2` / `torr`
- 第 43 句 → `tab2` / `tilt`
- 第 50 句 → `tab2` / `tilt`
- 第 52 句 → `tab2` / `tilt`
- 第 55 句 → `tab2` / `water`
- 第 56 句 → `tab2` / `water`
- 第 59 句 → `tab2` / `water`
- 第 65 句 → `tab3` / `crown`
- 第 69 句 → `tab3` / `archi`
- 第 71 句 → `tab3` / `archi`
- 第 73 句 → `tab3` / `archi`
- 第 77 句 → `tab3` / `archi`
- 第 79 句 → `tab3` / `archi`
- 第 82 句 → `tab3` / `cao`
- 第 85 句 → `tab3` / `cao`
- 第 91 句 → `tab3` / `cao`
- 第 100 句 → `tab4` / `sinkfloat`
- 第 103 句 → `tab4` / `sinkfloat`
- 第 106 句 → `tab4` / `ship`
- 第 109 句 → `tab4` / `ship`
- 第 112 句 → `tab4` / `ship`
- 第 114 句 → `tab4` / `bubble`
- 第 119 句 → `tab4` / `bubble`
- 第 123 句 → `tab5` / `ice`
- 第 125 句 → `tab5` / `ice`
- 第 132 句 → `tab5` / `vol`
- 第 135 句 → `tab5` / `vol`
