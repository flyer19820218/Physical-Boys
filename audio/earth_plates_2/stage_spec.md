# magnetism_1 stage 規格

由 `tools/voice/lesson_studio/build_lesson.py` 從稿子自動產生，請改稿子或腳本，不要手改 `stage.json`。

- `page`：課程頁 `magnetism_1.html`。
- `cuts`：播到 `＊切頁：<標題>` 時，點 `.tab-button[data-tab=tab]`，再點 `.sub-tab-btn[data-sub=sub]`。標題必須與稿子完全一致（共 5 個）。
- `at`：播到第 N 句（說話行編號，兩位數，與 manifest 的 `id` 相同）時，切到指定 tab／sub（共 27 個）。
- `subs`：該句的字幕顯示字。只放字幕和念的字不同的句子：N 極／S 極（恩極→N 極、艾斯極→S 極）與國字數字轉阿拉伯數字（五十牛頓→50 牛頓），其餘字不變；`pins` 是釘選黃條同樣的轉換（共 14 句）。沒列在 `subs` 的句子，字幕直接顯示 `text`。

句號有兩種寫法，不要混用：`id`／`stage.json` 的 key 是兩位數（01–106）；音檔檔名是三位數（`001_yanjun.mp3`–`106_...`），說話者對應 彥君=yanjun、曉臻=xiaozhen、合聲=hesheng。

## cuts

- 板塊交界在哪裡？ → `tab1` / `None`
- 海底怎麼長出新地殼？ → `tab2` / `None`
- 誰該往下沉？ → `tab3` / `None`
- 山是怎麼長高的？ → `tab4` / `None`
- 地震火山藏著什麼線索？ → `tab5` / `None`

## at

- 第 01 句 → `tab1` / `None`
- 第 07 句 → `tab1` / `None`
- 第 10 句 → `tab1` / `None`
- 第 13 句 → `tab1` / `None`
- 第 18 句 → `tab1` / `None`
- 第 20 句 → `tab1` / `None`
- 第 31 句 → `tab2` / `None`
- 第 33 句 → `tab2` / `None`
- 第 40 句 → `tab2` / `None`
- 第 43 句 → `tab2` / `None`
- 第 47 句 → `tab2` / `None`
- 第 56 句 → `tab3` / `None`
- 第 58 句 → `tab3` / `None`
- 第 61 句 → `tab3` / `None`
- 第 67 句 → `tab3` / `None`
- 第 71 句 → `tab3` / `None`
- 第 74 句 → `tab3` / `None`
- 第 81 句 → `tab4` / `None`
- 第 83 句 → `tab4` / `None`
- 第 88 句 → `tab4` / `None`
- 第 91 句 → `tab4` / `None`
- 第 96 句 → `tab4` / `None`
- 第 104 句 → `tab5` / `None`
- 第 106 句 → `tab5` / `None`
- 第 109 句 → `tab5` / `None`
- 第 114 句 → `tab5` / `None`
- 第 117 句 → `tab5` / `None`
