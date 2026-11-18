# magnetism_1 stage 規格

由 `tools/voice/lesson_studio/build_lesson.py` 從稿子自動產生，請改稿子或腳本，不要手改 `stage.json`。

- `page`：課程頁 `magnetism_1.html`。
- `cuts`：播到 `＊切頁：<標題>` 時，點 `.tab-button[data-tab=tab]`，再點 `.sub-tab-btn[data-sub=sub]`。標題必須與稿子完全一致（共 5 個）。
- `at`：播到第 N 句（說話行編號，兩位數，與 manifest 的 `id` 相同）時，切到指定 tab／sub（共 51 個）。
- `subs`：該句的字幕顯示字。只放字幕和念的字不同的句子：N 極／S 極（恩極→N 極、艾斯極→S 極）與國字數字轉阿拉伯數字（五十牛頓→50 牛頓），其餘字不變；`pins` 是釘選黃條同樣的轉換（共 23 句）。沒列在 `subs` 的句子，字幕直接顯示 `text`。

句號有兩種寫法，不要混用：`id`／`stage.json` 的 key 是兩位數（01–106）；音檔檔名是三位數（`001_yanjun.mp3`–`106_...`），說話者對應 彥君=yanjun、曉臻=xiaozhen、合聲=hesheng。

## cuts

- 夏天白天為何長？ → `tab1` / `None`
- 天球是什麼？ → `tab2` / `sub1`
- 換個緯度看天空 → `tab3` / `None`
- 五個現象一起變 → `tab4` / `None`
- 白天也有星座？ → `tab5` / `helio`

## at

- 第 01 句 → `tab1` / `None`
- 第 07 句 → `tab1` / `None`
- 第 14 句 → `tab1` / `None`
- 第 16 句 → `tab1` / `None`
- 第 18 句 → `tab1` / `None`
- 第 19 句 → `tab1` / `None`
- 第 20 句 → `tab1` / `None`
- 第 21 句 → `tab1` / `None`
- 第 24 句 → `tab1` / `None`
- 第 25 句 → `tab2` / `sub1`
- 第 27 句 → `tab2` / `sub1`
- 第 29 句 → `tab2` / `sub1`
- 第 34 句 → `tab2` / `sub2`
- 第 51 句 → `tab3` / `None`
- 第 54 句 → `tab3` / `None`
- 第 57 句 → `tab3` / `None`
- 第 61 句 → `tab3` / `None`
- 第 63 句 → `tab3` / `None`
- 第 66 句 → `tab3` / `None`
- 第 67 句 → `tab3` / `None`
- 第 70 句 → `tab3` / `None`
- 第 71 句 → `tab3` / `None`
- 第 73 句 → `tab3` / `None`
- 第 74 句 → `tab3` / `None`
- 第 77 句 → `tab3` / `None`
- 第 79 句 → `tab3` / `None`
- 第 80 句 → `tab3` / `None`
- 第 83 句 → `tab3` / `None`
- 第 84 句 → `tab3` / `None`
- 第 85 句 → `tab3` / `None`
- 第 87 句 → `tab3` / `None`
- 第 91 句 → `tab4` / `None`
- 第 94 句 → `tab4` / `None`
- 第 95 句 → `tab4` / `None`
- 第 97 句 → `tab4` / `None`
- 第 99 句 → `tab4` / `None`
- 第 101 句 → `tab4` / `None`
- 第 104 句 → `tab5` / `helio`
- 第 111 句 → `tab5` / `helio`
- 第 114 句 → `tab5` / `helio`
- 第 115 句 → `tab5` / `helio`
- 第 117 句 → `tab5` / `helio`
- 第 119 句 → `tab5` / `tw`
- 第 120 句 → `tab5` / `tw`
- 第 121 句 → `tab5` / `tw`
- 第 124 句 → `tab5` / `disc`
- 第 126 句 → `tab5` / `disc`
- 第 127 句 → `tab5` / `disc`
- 第 131 句 → `tab5` / `pc`
- 第 134 句 → `tab5` / `helio`
- 第 135 句 → `tab5` / `helio`
