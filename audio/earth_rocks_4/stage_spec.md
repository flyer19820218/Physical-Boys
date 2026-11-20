# magnetism_1 stage 規格

由 `tools/voice/lesson_studio/build_lesson.py` 從稿子自動產生，請改稿子或腳本，不要手改 `stage.json`。

- `page`：課程頁 `magnetism_1.html`。
- `cuts`：播到 `＊切頁：<標題>` 時，點 `.tab-button[data-tab=tab]`，再點 `.sub-tab-btn[data-sub=sub]`。標題必須與稿子完全一致（共 4 個）。
- `at`：播到第 N 句（說話行編號，兩位數，與 manifest 的 `id` 相同）時，切到指定 tab／sub（共 28 個）。
- `subs`：該句的字幕顯示字。只放字幕和念的字不同的句子：N 極／S 極（恩極→N 極、艾斯極→S 極）與國字數字轉阿拉伯數字（五十牛頓→50 牛頓），其餘字不變；`pins` 是釘選黃條同樣的轉換（共 13 句）。沒列在 `subs` 的句子，字幕直接顯示 `text`。

句號有兩種寫法，不要混用：`id`／`stage.json` 的 key 是兩位數（01–106）；音檔檔名是三位數（`001_yanjun.mp3`–`106_...`），說話者對應 彥君=yanjun、曉臻=xiaozhen、合聲=hesheng。

## cuts

- 岩石是什麼做的？ → `btn-tab-0` / `None`
- 冷卻快慢有差嗎？ → `btn-tab-1` / `None`
- 泥沙怎麼變成石頭？ → `btn-tab-2` / `None`
- 岩石會一直變身嗎？ → `btn-tab-3` / `None`

## at

- 第 01 句 → `btn-tab-0` / `None`
- 第 20 句 → `btn-tab-0` / `None`
- 第 22 句 → `btn-tab-0` / `None`
- 第 24 句 → `btn-tab-0` / `None`
- 第 27 句 → `btn-tab-0` / `None`
- 第 31 句 → `btn-tab-1` / `None`
- 第 34 句 → `btn-tab-1` / `None`
- 第 36 句 → `btn-tab-1` / `None`
- 第 38 句 → `btn-tab-1` / `None`
- 第 42 句 → `btn-tab-1` / `None`
- 第 50 句 → `btn-tab-2` / `None`
- 第 55 句 → `btn-tab-2` / `None`
- 第 57 句 → `btn-tab-2` / `None`
- 第 60 句 → `btn-tab-2` / `None`
- 第 62 句 → `btn-tab-2` / `None`
- 第 67 句 → `btn-tab-2` / `None`
- 第 70 句 → `btn-tab-2` / `None`
- 第 72 句 → `btn-tab-2` / `None`
- 第 74 句 → `btn-tab-2` / `None`
- 第 76 句 → `btn-tab-2` / `None`
- 第 82 句 → `btn-tab-3` / `None`
- 第 86 句 → `btn-tab-3` / `None`
- 第 88 句 → `btn-tab-3` / `None`
- 第 91 句 → `btn-tab-3` / `None`
- 第 92 句 → `btn-tab-3` / `None`
- 第 93 句 → `btn-tab-3` / `None`
- 第 94 句 → `btn-tab-3` / `None`
- 第 96 句 → `btn-tab-3` / `None`
