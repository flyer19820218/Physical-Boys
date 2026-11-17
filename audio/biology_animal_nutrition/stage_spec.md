# magnetism_1 stage 規格

由 `tools/voice/lesson_studio/build_lesson.py` 從稿子自動產生，請改稿子或腳本，不要手改 `stage.json`。

- `page`：課程頁 `magnetism_1.html`。
- `cuts`：播到 `＊切頁：<標題>` 時，點 `.tab-button[data-tab=tab]`，再點 `.sub-tab-btn[data-sub=sub]`。標題必須與稿子完全一致（共 2 個）。
- `at`：播到第 N 句（說話行編號，兩位數，與 manifest 的 `id` 相同）時，切到指定 tab／sub（共 47 個）。
- `subs`：該句的字幕顯示字。只放字幕和念的字不同的句子：N 極／S 極（恩極→N 極、艾斯極→S 極）與國字數字轉阿拉伯數字（五十牛頓→50 牛頓），其餘字不變；`pins` 是釘選黃條同樣的轉換（共 6 句）。沒列在 `subs` 的句子，字幕直接顯示 `text`。

句號有兩種寫法，不要混用：`id`／`stage.json` 的 key 是兩位數（01–106）；音檔檔名是三位數（`001_yanjun.mp3`–`106_...`），說話者對應 彥君=yanjun、曉臻=xiaozhen、合聲=hesheng。

## cuts

- 先看整條路（消化道概論） → `page-0` / `None`
- 跟著這一口（逐站消化與吸收） → `page-1` / `None`

## at

- 第 01 句 → `page-0` / `None`
- 第 07 句 → `page-0` / `None`
- 第 09 句 → `page-0` / `None`
- 第 10 句 → `page-0` / `None`
- 第 11 句 → `page-0` / `None`
- 第 12 句 → `page-0` / `None`
- 第 16 句 → `page-0` / `None`
- 第 20 句 → `page-0` / `None`
- 第 21 句 → `page-0` / `None`
- 第 23 句 → `page-0` / `None`
- 第 24 句 → `page-0` / `None`
- 第 26 句 → `page-0` / `None`
- 第 27 句 → `page-0` / `None`
- 第 28 句 → `page-0` / `None`
- 第 30 句 → `page-0` / `None`
- 第 31 句 → `page-0` / `None`
- 第 32 句 → `page-0` / `None`
- 第 33 句 → `page-0` / `None`
- 第 34 句 → `page-0` / `None`
- 第 38 句 → `page-1` / `None`
- 第 39 句 → `page-1` / `None`
- 第 40 句 → `page-1` / `None`
- 第 42 句 → `page-1` / `None`
- 第 43 句 → `page-1` / `None`
- 第 47 句 → `page-1` / `None`
- 第 48 句 → `page-1` / `None`
- 第 49 句 → `page-1` / `None`
- 第 54 句 → `page-1` / `None`
- 第 55 句 → `page-1` / `None`
- 第 56 句 → `page-1` / `None`
- 第 59 句 → `page-1` / `None`
- 第 61 句 → `page-1` / `None`
- 第 62 句 → `page-1` / `None`
- 第 65 句 → `page-1` / `None`
- 第 68 句 → `page-1` / `None`
- 第 70 句 → `page-1` / `None`
- 第 78 句 → `page-1` / `None`
- 第 82 句 → `page-1` / `None`
- 第 84 句 → `page-1` / `None`
- 第 85 句 → `page-1` / `None`
- 第 89 句 → `page-1` / `None`
- 第 91 句 → `page-1` / `None`
- 第 93 句 → `page-1` / `None`
- 第 96 句 → `page-1` / `None`
- 第 98 句 → `page-1` / `None`
- 第 99 句 → `page-1` / `None`
- 第 101 句 → `page-1` / `None`
