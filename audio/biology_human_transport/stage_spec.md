# magnetism_1 stage 規格

由 `tools/voice/lesson_studio/build_lesson.py` 從稿子自動產生，請改稿子或腳本，不要手改 `stage.json`。

- `page`：課程頁 `magnetism_1.html`。
- `cuts`：播到 `＊切頁：<標題>` 時，點 `.tab-button[data-tab=tab]`，再點 `.sub-tab-btn[data-sub=sub]`。標題必須與稿子完全一致（共 6 個）。
- `at`：播到第 N 句（說話行編號，兩位數，與 manifest 的 `id` 相同）時，切到指定 tab／sub（共 44 個）。
- `subs`：該句的字幕顯示字。只放字幕和念的字不同的句子：N 極／S 極（恩極→N 極、艾斯極→S 極）與國字數字轉阿拉伯數字（五十牛頓→50 牛頓），其餘字不變；`pins` 是釘選黃條同樣的轉換（共 5 句）。沒列在 `subs` 的句子，字幕直接顯示 `text`。

句號有兩種寫法，不要混用：`id`／`stage.json` 的 key 是兩位數（01–106）；音檔檔名是三位數（`001_yanjun.mp3`–`106_...`），說話者對應 彥君=yanjun、曉臻=xiaozhen、合聲=hesheng。

## cuts

- 不是實心球 → `heart` / `None`
- 三種管，三種任務 → `vessels` / `None`
- 誰送氧？誰修補？ → `blood` / `None`
- 跟一顆紅血球走 → `circulation` / `None`
- 流出去，怎麼回來？ → `lymph` / `None`
- 看見，量出來 → `experiment` / `None`

## at

- 第 01 句 → `heart` / `None`
- 第 14 句 → `heart` / `None`
- 第 16 句 → `heart` / `None`
- 第 18 句 → `heart` / `None`
- 第 22 句 → `heart` / `None`
- 第 24 句 → `heart` / `None`
- 第 26 句 → `heart` / `None`
- 第 28 句 → `heart` / `None`
- 第 29 句 → `heart` / `None`
- 第 31 句 → `heart` / `None`
- 第 34 句 → `vessels` / `None`
- 第 36 句 → `vessels` / `None`
- 第 37 句 → `vessels` / `None`
- 第 41 句 → `vessels` / `None`
- 第 42 句 → `vessels` / `None`
- 第 43 句 → `vessels` / `None`
- 第 49 句 → `vessels` / `None`
- 第 51 句 → `blood` / `None`
- 第 53 句 → `blood` / `None`
- 第 58 句 → `blood` / `None`
- 第 60 句 → `blood` / `None`
- 第 62 句 → `blood` / `None`
- 第 64 句 → `blood` / `None`
- 第 67 句 → `circulation` / `None`
- 第 68 句 → `circulation` / `None`
- 第 70 句 → `circulation` / `None`
- 第 72 句 → `circulation` / `None`
- 第 74 句 → `circulation` / `None`
- 第 78 句 → `circulation` / `None`
- 第 80 句 → `circulation` / `None`
- 第 82 句 → `circulation` / `None`
- 第 84 句 → `circulation` / `None`
- 第 86 句 → `circulation` / `None`
- 第 88 句 → `circulation` / `None`
- 第 90 句 → `lymph` / `None`
- 第 91 句 → `lymph` / `None`
- 第 93 句 → `lymph` / `None`
- 第 98 句 → `lymph` / `None`
- 第 100 句 → `lymph` / `None`
- 第 102 句 → `lymph` / `None`
- 第 105 句 → `experiment` / `None`
- 第 108 句 → `experiment` / `None`
- 第 113 句 → `experiment` / `None`
- 第 114 句 → `experiment` / `None`
