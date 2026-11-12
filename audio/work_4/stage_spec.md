# magnetism_1 stage 規格

由 `tools/voice/lesson_studio/build_lesson.py` 從稿子自動產生，請改稿子或腳本，不要手改 `stage.json`。

- `page`：課程頁 `magnetism_1.html`。
- `cuts`：播到 `＊切頁：<標題>` 時，點 `.tab-button[data-tab=tab]`，再點 `.sub-tab-btn[data-sub=sub]`。標題必須與稿子完全一致（共 5 個）。
- `at`：播到第 N 句（說話行編號，兩位數，與 manifest 的 `id` 相同）時，切到指定 tab／sub（共 38 個）。
- `subs`：該句的字幕顯示字。只放字幕和念的字不同的句子：N 極／S 極（恩極→N 極、艾斯極→S 極）與國字數字轉阿拉伯數字（五十牛頓→50 牛頓），其餘字不變；`pins` 是釘選黃條同樣的轉換（共 60 句）。沒列在 `subs` 的句子，字幕直接顯示 `text`。

句號有兩種寫法，不要混用：`id`／`stage.json` 的 key 是兩位數（01–106）；音檔檔名是三位數（`001_yanjun.mp3`–`106_...`），說話者對應 彥君=yanjun、曉臻=xiaozhen、合聲=hesheng。

## cuts

- 機械不省功 → `tab1` / `None`
- 握遠一點就贏 → `tab2` / `None`
- 轉的都是同一招 → `tab3` / `None`
- 把高度換成路 → `tab4` / `None`
- 段考會考這樣 → `tab5` / `None`

## at

- 第 09 句 → `tab1` / `None`
- 第 15 句 → `tab1` / `None`
- 第 19 句 → `tab1` / `None`
- 第 21 句 → `tab1` / `None`
- 第 25 句 → `tab1` / `None`
- 第 28 句 → `tab2` / `None`
- 第 38 句 → `tab2` / `None`
- 第 40 句 → `tab2` / `None`
- 第 42 句 → `tab2` / `None`
- 第 45 句 → `tab2` / `None`
- 第 47 句 → `tab2` / `None`
- 第 52 句 → `tab3` / `None`
- 第 60 句 → `tab3` / `None`
- 第 64 句 → `tab3` / `None`
- 第 67 句 → `tab3` / `None`
- 第 69 句 → `tab3` / `None`
- 第 70 句 → `tab3` / `None`
- 第 72 句 → `tab3` / `None`
- 第 75 句 → `tab3` / `None`
- 第 77 句 → `tab3` / `None`
- 第 83 句 → `tab4` / `None`
- 第 87 句 → `tab4` / `None`
- 第 91 句 → `tab4` / `None`
- 第 95 句 → `tab4` / `None`
- 第 98 句 → `tab4` / `None`
- 第 100 句 → `tab4` / `None`
- 第 105 句 → `tab4` / `None`
- 第 109 句 → `tab5` / `None`
- 第 113 句 → `tab5` / `None`
- 第 115 句 → `tab5` / `None`
- 第 118 句 → `tab5` / `None`
- 第 121 句 → `tab5` / `None`
- 第 124 句 → `tab5` / `None`
- 第 127 句 → `tab5` / `None`
- 第 130 句 → `tab5` / `None`
- 第 133 句 → `tab5` / `None`
- 第 136 句 → `tab5` / `None`
- 第 139 句 → `tab5` / `None`
