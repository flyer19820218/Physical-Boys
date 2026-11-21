# magnetism_1 stage 規格

由 `tools/voice/lesson_studio/build_lesson.py` 從稿子自動產生，請改稿子或腳本，不要手改 `stage.json`。

- `page`：課程頁 `magnetism_1.html`。
- `cuts`：播到 `＊切頁：<標題>` 時，點 `.tab-button[data-tab=tab]`，再點 `.sub-tab-btn[data-sub=sub]`。標題必須與稿子完全一致（共 4 個）。
- `at`：播到第 N 句（說話行編號，兩位數，與 manifest 的 `id` 相同）時，切到指定 tab／sub（共 47 個）。
- `subs`：該句的字幕顯示字。只放字幕和念的字不同的句子：N 極／S 極（恩極→N 極、艾斯極→S 極）與國字數字轉阿拉伯數字（五十牛頓→50 牛頓），其餘字不變；`pins` 是釘選黃條同樣的轉換（共 73 句）。沒列在 `subs` 的句子，字幕直接顯示 `text`。

句號有兩種寫法，不要混用：`id`／`stage.json` 的 key 是兩位數（01–106）；音檔檔名是三位數（`001_yanjun.mp3`–`106_...`），說話者對應 彥君=yanjun、曉臻=xiaozhen、合聲=hesheng。

## cuts

- 水在哪裡？ → `btn-tab-0` / `None`
- 雨多為什麼缺水？ → `btn-tab-1` / `None`
- 冰融化海面升嗎？ → `btn-tab-2` / `None`
- 井為什麼會乾？ → `btn-tab-3` / `None`

## at

- 第 01 句 → `btn-tab-0` / `None`
- 第 07 句 → `btn-tab-0` / `None`
- 第 15 句 → `btn-tab-0` / `None`
- 第 20 句 → `btn-tab-0` / `None`
- 第 23 句 → `btn-tab-0` / `None`
- 第 28 句 → `btn-tab-0` / `None`
- 第 29 句 → `btn-tab-0` / `None`
- 第 32 句 → `btn-tab-0` / `None`
- 第 36 句 → `btn-tab-0` / `None`
- 第 40 句 → `btn-tab-1` / `None`
- 第 47 句 → `btn-tab-1` / `None`
- 第 52 句 → `btn-tab-1` / `None`
- 第 56 句 → `btn-tab-1` / `None`
- 第 61 句 → `btn-tab-1` / `None`
- 第 66 句 → `btn-tab-1` / `None`
- 第 69 句 → `btn-tab-1` / `None`
- 第 73 句 → `btn-tab-1` / `None`
- 第 78 句 → `btn-tab-1` / `None`
- 第 86 句 → `btn-tab-2` / `None`
- 第 94 句 → `btn-tab-2` / `None`
- 第 95 句 → `btn-tab-2` / `None`
- 第 97 句 → `btn-tab-2` / `None`
- 第 99 句 → `btn-tab-2` / `None`
- 第 101 句 → `btn-tab-2` / `None`
- 第 103 句 → `btn-tab-2` / `None`
- 第 108 句 → `btn-tab-2` / `None`
- 第 115 句 → `btn-tab-3` / `None`
- 第 123 句 → `btn-tab-3` / `None`
- 第 126 句 → `btn-tab-3` / `None`
- 第 128 句 → `btn-tab-3` / `None`
- 第 131 句 → `btn-tab-3` / `None`
- 第 133 句 → `btn-tab-3` / `None`
- 第 135 句 → `btn-tab-3` / `None`
- 第 139 句 → `btn-tab-3` / `None`
- 第 143 句 → `btn-tab-3` / `None`
- 第 146 句 → `btn-tab-3` / `None`
- 第 148 句 → `btn-tab-3` / `None`
- 第 150 句 → `btn-tab-3` / `None`
- 第 151 句 → `btn-tab-3` / `None`
- 第 157 句 → `btn-tab-3` / `None`
- 第 162 句 → `btn-tab-3` / `None`
- 第 164 句 → `btn-tab-3` / `None`
- 第 166 句 → `btn-tab-3` / `None`
- 第 168 句 → `btn-tab-3` / `None`
- 第 170 句 → `btn-tab-3` / `None`
- 第 173 句 → `btn-tab-3` / `None`
- 第 175 句 → `btn-tab-3` / `None`
