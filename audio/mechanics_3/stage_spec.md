# magnetism_1 stage 規格

由 `tools/voice/lesson_studio/build_lesson.py` 從稿子自動產生，請改稿子或腳本，不要手改 `stage.json`。

- `page`：課程頁 `magnetism_1.html`。
- `cuts`：播到 `＊切頁：<標題>` 時，點 `.tab-button[data-tab=tab]`，再點 `.sub-tab-btn[data-sub=sub]`。標題必須與稿子完全一致（共 5 個）。
- `at`：播到第 N 句（說話行編號，兩位數，與 manifest 的 `id` 相同）時，切到指定 tab／sub（共 49 個）。
- `subs`：該句的字幕顯示字。只放字幕和念的字不同的句子：N 極／S 極（恩極→N 極、艾斯極→S 極）與國字數字轉阿拉伯數字（五十牛頓→50 牛頓），其餘字不變；`pins` 是釘選黃條同樣的轉換（共 39 句）。沒列在 `subs` 的句子，字幕直接顯示 `text`。

句號有兩種寫法，不要混用：`id`／`stage.json` 的 key 是兩位數（01–106）；音檔檔名是三位數（`001_yanjun.mp3`–`106_...`），說話者對應 彥君=yanjun、曉臻=xiaozhen、合聲=hesheng。

## cuts

- 溜冰鞋在冰上滑，柏油路卻滑不動？ → `tab1` / `micro`
- 衣櫃一推動，反而變輕鬆？ → `tab2` / `static`
- 同一個木塊，哪一次最難拉動？ → `tab3` / `surface`
- 鏈條要上油、煞車皮卻要有紋路？ → `tab4` / `more`
- 壓在牆上的書，是推力撐住它嗎？ → `tab5` / `fridge`

## at

- 第 01 句 → `tab1` / `micro`
- 第 15 句 → `tab1` / `dir`
- 第 22 句 → `tab1` / `dir`
- 第 25 句 → `tab1` / `dir`
- 第 27 句 → `tab1` / `dir`
- 第 30 句 → `tab1` / `dir`
- 第 31 句 → `tab2` / `static`
- 第 33 句 → `tab2` / `static`
- 第 37 句 → `tab2` / `static`
- 第 40 句 → `tab2` / `kinetic`
- 第 45 句 → `tab2` / `kinetic`
- 第 47 句 → `tab2` / `kinetic`
- 第 51 句 → `tab3` / `surface`
- 第 54 句 → `tab3` / `surface`
- 第 56 句 → `tab3` / `surface`
- 第 57 句 → `tab3` / `surface`
- 第 58 句 → `tab3` / `surface`
- 第 59 句 → `tab3` / `area`
- 第 61 句 → `tab3` / `area`
- 第 62 句 → `tab3` / `area`
- 第 64 句 → `tab3` / `normal`
- 第 66 句 → `tab3` / `normal`
- 第 67 句 → `tab3` / `normal`
- 第 68 句 → `tab3` / `normal`
- 第 69 句 → `tab3` / `normal`
- 第 72 句 → `tab3` / `normal`
- 第 75 句 → `tab4` / `more`
- 第 78 句 → `tab4` / `more`
- 第 80 句 → `tab4` / `less`
- 第 82 句 → `tab4` / `less`
- 第 83 句 → `tab4` / `less`
- 第 84 句 → `tab4` / `less`
- 第 87 句 → `tab4` / `less`
- 第 88 句 → `tab4` / `less`
- 第 91 句 → `tab5` / `fridge`
- 第 93 句 → `tab5` / `fridge`
- 第 94 句 → `tab5` / `fridge`
- 第 97 句 → `tab5` / `fridge`
- 第 99 句 → `tab5` / `fridge`
- 第 101 句 → `tab5` / `ab`
- 第 103 句 → `tab5` / `ab`
- 第 105 句 → `tab5` / `ab`
- 第 106 句 → `tab5` / `ab`
- 第 108 句 → `tab5` / `ab`
- 第 109 句 → `tab5` / `wall`
- 第 112 句 → `tab5` / `wall`
- 第 113 句 → `tab5` / `wall`
- 第 114 句 → `tab5` / `wall`
- 第 115 句 → `tab5` / `wall`
