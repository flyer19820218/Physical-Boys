# magnetism_1 stage 規格

由 `tools/voice/lesson_studio/build_lesson.py` 從稿子自動產生，請改稿子或腳本，不要手改 `stage.json`。

- `page`：課程頁 `magnetism_1.html`。
- `cuts`：播到 `＊切頁：<標題>` 時，點 `.tab-button[data-tab=tab]`，再點 `.sub-tab-btn[data-sub=sub]`。標題必須與稿子完全一致（共 5 個）。
- `at`：播到第 N 句（說話行編號，兩位數，與 manifest 的 `id` 相同）時，切到指定 tab／sub（共 36 個）。
- `subs`：該句的字幕顯示字。只放字幕和念的字不同的句子：N 極／S 極（恩極→N 極、艾斯極→S 極）與國字數字轉阿拉伯數字（五十牛頓→50 牛頓），其餘字不變；`pins` 是釘選黃條同樣的轉換（共 28 句）。沒列在 `subs` 的句子，字幕直接顯示 `text`。

句號有兩種寫法，不要混用：`id`／`stage.json` 的 key 是兩位數（01–106）；音檔檔名是三位數（`001_yanjun.mp3`–`106_...`），說話者對應 彥君=yanjun、曉臻=xiaozhen、合聲=hesheng。

## cuts

- 蛙腿為什麼抽動？ → `tab-history` / `None`
- 兩片一樣的金屬行嗎？ → `tab-origin` / `None`
- 電子從哪來？到哪去？ → `tab-redox` / `None`
- 電池用久為何會停？ → `tab-cell` / `None`
- 為什麼不能亂充電？ → `tab-types` / `None`

## at

- 第 11 句 → `tab-history` / `None`
- 第 13 句 → `tab-history` / `None`
- 第 14 句 → `tab-history` / `None`
- 第 16 句 → `tab-history` / `None`
- 第 18 句 → `tab-history` / `None`
- 第 20 句 → `tab-history` / `None`
- 第 22 句 → `tab-history` / `None`
- 第 23 句 → `tab-history` / `None`
- 第 25 句 → `tab-history` / `None`
- 第 26 句 → `tab-history` / `None`
- 第 27 句 → `tab-history` / `None`
- 第 31 句 → `tab-history` / `None`
- 第 39 句 → `tab-origin` / `None`
- 第 41 句 → `tab-origin` / `None`
- 第 44 句 → `tab-origin` / `None`
- 第 46 句 → `tab-origin` / `None`
- 第 50 句 → `tab-origin` / `None`
- 第 53 句 → `tab-origin` / `None`
- 第 64 句 → `tab-redox` / `None`
- 第 67 句 → `tab-redox` / `None`
- 第 70 句 → `tab-redox` / `None`
- 第 72 句 → `tab-redox` / `None`
- 第 74 句 → `tab-redox` / `None`
- 第 75 句 → `tab-redox` / `None`
- 第 88 句 → `tab-cell` / `None`
- 第 90 句 → `tab-cell` / `None`
- 第 93 句 → `tab-cell` / `None`
- 第 96 句 → `tab-cell` / `None`
- 第 98 句 → `tab-cell` / `None`
- 第 101 句 → `tab-cell` / `None`
- 第 118 句 → `tab-types` / `None`
- 第 120 句 → `tab-types` / `None`
- 第 123 句 → `tab-types` / `None`
- 第 127 句 → `tab-types` / `None`
- 第 130 句 → `tab-types` / `None`
- 第 133 句 → `tab-types` / `None`
