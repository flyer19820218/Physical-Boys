# magnetism_1 stage 規格

由 `tools/voice/lesson_studio/build_lesson.py` 從稿子自動產生，請改稿子或腳本，不要手改 `stage.json`。

- `page`：課程頁 `magnetism_1.html`。
- `cuts`：播到 `＊切頁：<標題>` 時，點 `.tab-button[data-tab=tab]`，再點 `.sub-tab-btn[data-sub=sub]`。標題必須與稿子完全一致（共 8 個）。
- `at`：播到第 N 句（說話行編號，兩位數，與 manifest 的 `id` 相同）時，切到指定 tab／sub（共 40 個）。
- `subs`：該句的字幕顯示字。只放字幕和念的字不同的句子：N 極／S 極（恩極→N 極、艾斯極→S 極）與國字數字轉阿拉伯數字（五十牛頓→50 牛頓），其餘字不變；`pins` 是釘選黃條同樣的轉換（共 19 句）。沒列在 `subs` 的句子，字幕直接顯示 `text`。

句號有兩種寫法，不要混用：`id`／`stage.json` 的 key 是兩位數（01–106）；音檔檔名是三位數（`001_yanjun.mp3`–`106_...`），說話者對應 彥君=yanjun、曉臻=xiaozhen、合聲=hesheng。

## cuts

- 白光裡藏著什麼顏色？ → `prism` / `prism`
- 手機怎麼用三種光變出所有顏色？ → `rgb` / `rgb`
- 紅衣服為什麼會變黑？ → `object_color` / `object_color`
- 紅愛心為什麼會隱形？ → `quiz_love` / `quiz_love`
- 雨滴裡的光怎麼走？ → `rainbow_lab` / `rainbow_trace`
- 哪一道光會進眼睛？ → `rainbow_lab` / `rainbow_radar`
- 同一滴水的雙重身分 → `rainbow_lab` / `rainbow_identity`
- 把圓找回來 → `rainbow_lab` / `rainbow_circle`

## at

- 第 01 句 → `prism` / `prism`
- 第 03 句 → `object_color` / `object_color`
- 第 07 句 → `prism` / `prism`
- 第 17 句 → `prism` / `prism`
- 第 19 句 → `prism` / `prism`
- 第 20 句 → `rgb` / `rgb`
- 第 23 句 → `rgb` / `rgb`
- 第 24 句 → `rgb` / `rgb`
- 第 25 句 → `rgb` / `rgb`
- 第 27 句 → `rgb` / `rgb`
- 第 29 句 → `rgb` / `rgb`
- 第 31 句 → `rgb` / `rgb`
- 第 33 句 → `rgb` / `rgb`
- 第 37 句 → `rgb` / `rgb`
- 第 40 句 → `object_color` / `object_color`
- 第 42 句 → `object_color` / `object_color`
- 第 48 句 → `object_color` / `object_color`
- 第 50 句 → `object_color` / `object_color`
- 第 53 句 → `object_color` / `object_color`
- 第 55 句 → `object_color` / `object_color`
- 第 57 句 → `object_color` / `object_color`
- 第 61 句 → `quiz_love` / `quiz_love`
- 第 64 句 → `quiz_love` / `quiz_love`
- 第 67 句 → `quiz_love` / `quiz_love`
- 第 70 句 → `quiz_love` / `quiz_love`
- 第 73 句 → `rainbow_lab` / `rainbow_trace`
- 第 75 句 → `rainbow_lab` / `rainbow_trace`
- 第 76 句 → `rainbow_lab` / `rainbow_trace`
- 第 79 句 → `rainbow_lab` / `rainbow_trace`
- 第 82 句 → `rainbow_lab` / `rainbow_radar`
- 第 86 句 → `rainbow_lab` / `rainbow_radar`
- 第 89 句 → `rainbow_lab` / `rainbow_radar`
- 第 91 句 → `rainbow_lab` / `rainbow_radar`
- 第 94 句 → `rainbow_lab` / `rainbow_identity`
- 第 98 句 → `rainbow_lab` / `rainbow_identity`
- 第 100 句 → `rainbow_lab` / `rainbow_identity`
- 第 104 句 → `rainbow_lab` / `rainbow_circle`
- 第 106 句 → `rainbow_lab` / `rainbow_circle`
- 第 108 句 → `rainbow_lab` / `rainbow_circle`
- 第 111 句 → `rainbow_lab` / `rainbow_circle`
