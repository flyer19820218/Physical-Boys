# magnetism_1 stage 規格

由 `tools/voice/lesson_studio/build_lesson.py` 從稿子自動產生，請改稿子或腳本，不要手改 `stage.json`。

- `page`：課程頁 `magnetism_1.html`。
- `cuts`：播到 `＊切頁：<標題>` 時，點 `.tab-button[data-tab=tab]`，再點 `.sub-tab-btn[data-sub=sub]`。標題必須與稿子完全一致（共 5 個）。
- `at`：播到第 N 句（說話行編號，兩位數，與 manifest 的 `id` 相同）時，切到指定 tab／sub（共 35 個）。
- `subs`：該句的字幕顯示字。只放字幕和念的字不同的句子：N 極／S 極（恩極→N 極、艾斯極→S 極）與國字數字轉阿拉伯數字（五十牛頓→50 牛頓），其餘字不變；`pins` 是釘選黃條同樣的轉換（共 26 句）。沒列在 `subs` 的句子，字幕直接顯示 `text`。

句號有兩種寫法，不要混用：`id`／`stage.json` 的 key 是兩位數（01–106）；音檔檔名是三位數（`001_yanjun.mp3`–`106_...`），說話者對應 彥君=yanjun、曉臻=xiaozhen、合聲=hesheng。

## cuts

- 白天黑夜怎麼來？ → `tab1` / `None`
- 同一刻各是幾點？ → `tab2` / `None`
- 太陽真的在跑嗎？ → `tab3` / `None`
- 地軸會跟著轉嗎？ → `tab4` / `None`
- 四季從哪裡來？ → `tab5` / `None`

## at

- 第 01 句 → `tab1` / `None`
- 第 07 句 → `tab1` / `None`
- 第 13 句 → `tab1` / `None`
- 第 17 句 → `tab1` / `None`
- 第 22 句 → `tab1` / `None`
- 第 26 句 → `tab1` / `None`
- 第 31 句 → `tab2` / `None`
- 第 36 句 → `tab2` / `None`
- 第 38 句 → `tab2` / `None`
- 第 39 句 → `tab2` / `None`
- 第 40 句 → `tab2` / `None`
- 第 41 句 → `tab2` / `None`
- 第 42 句 → `tab2` / `None`
- 第 43 句 → `tab2` / `None`
- 第 44 句 → `tab2` / `None`
- 第 45 句 → `tab2` / `None`
- 第 53 句 → `tab3` / `None`
- 第 58 句 → `tab3` / `None`
- 第 60 句 → `tab3` / `None`
- 第 62 句 → `tab3` / `None`
- 第 63 句 → `tab3` / `None`
- 第 74 句 → `tab4` / `None`
- 第 77 句 → `tab4` / `None`
- 第 80 句 → `tab4` / `None`
- 第 81 句 → `tab4` / `None`
- 第 82 句 → `tab4` / `None`
- 第 85 句 → `tab4` / `None`
- 第 92 句 → `tab5` / `None`
- 第 95 句 → `tab5` / `None`
- 第 97 句 → `tab5` / `None`
- 第 100 句 → `tab5` / `None`
- 第 102 句 → `tab5` / `None`
- 第 103 句 → `tab5` / `None`
- 第 107 句 → `tab5` / `None`
- 第 109 句 → `tab5` / `None`
