# magnetism_1 stage 規格

由 `tools/voice/lesson_studio/build_lesson.py` 從稿子自動產生，請改稿子或腳本，不要手改 `stage.json`。

- `page`：課程頁 `magnetism_1.html`。
- `cuts`：播到 `＊切頁：<標題>` 時，點 `.tab-button[data-tab=tab]`，再點 `.sub-tab-btn[data-sub=sub]`。標題必須與稿子完全一致（共 4 個）。
- `at`：播到第 N 句（說話行編號，兩位數，與 manifest 的 `id` 相同）時，切到指定 tab／sub（共 52 個）。
- `subs`：該句的字幕顯示字。只放字幕和念的字不同的句子：N 極／S 極（恩極→N 極、艾斯極→S 極）與國字數字轉阿拉伯數字（五十牛頓→50 牛頓），其餘字不變；`pins` 是釘選黃條同樣的轉換（共 45 句）。沒列在 `subs` 的句子，字幕直接顯示 `text`。

句號有兩種寫法，不要混用：`id`／`stage.json` 的 key 是兩位數（01–106）；音檔檔名是三位數（`001_yanjun.mp3`–`106_...`），說話者對應 彥君=yanjun、曉臻=xiaozhen、合聲=hesheng。

## cuts

- 山為什麼不會一直長高？ → `btn-tab-0` / `None`
- 石頭會自己碎掉嗎？ → `btn-tab-1` / `None`
- 山上的石頭怎麼變成海邊的沙？ → `btn-tab-2` / `None`
- U 形谷、沙丘、海蝕洞是誰刻的？ → `btn-tab-3` / `None`

## at

- 第 01 句 → `btn-tab-0` / `None`
- 第 07 句 → `btn-tab-0` / `None`
- 第 14 句 → `btn-tab-0` / `None`
- 第 19 句 → `btn-tab-0` / `None`
- 第 23 句 → `btn-tab-0` / `None`
- 第 25 句 → `btn-tab-0` / `None`
- 第 28 句 → `btn-tab-0` / `None`
- 第 32 句 → `btn-tab-0` / `None`
- 第 36 句 → `btn-tab-0` / `None`
- 第 40 句 → `btn-tab-0` / `None`
- 第 41 句 → `btn-tab-1` / `None`
- 第 49 句 → `btn-tab-1` / `None`
- 第 54 句 → `btn-tab-1` / `None`
- 第 57 句 → `btn-tab-1` / `None`
- 第 60 句 → `btn-tab-1` / `None`
- 第 61 句 → `btn-tab-1` / `None`
- 第 62 句 → `btn-tab-1` / `None`
- 第 63 句 → `btn-tab-1` / `None`
- 第 66 句 → `btn-tab-1` / `None`
- 第 69 句 → `btn-tab-1` / `None`
- 第 71 句 → `btn-tab-1` / `None`
- 第 76 句 → `btn-tab-1` / `None`
- 第 77 句 → `btn-tab-1` / `None`
- 第 79 句 → `btn-tab-2` / `None`
- 第 85 句 → `btn-tab-2` / `None`
- 第 87 句 → `btn-tab-2` / `None`
- 第 89 句 → `btn-tab-2` / `None`
- 第 90 句 → `btn-tab-2` / `None`
- 第 91 句 → `btn-tab-2` / `None`
- 第 95 句 → `btn-tab-2` / `None`
- 第 97 句 → `btn-tab-2` / `None`
- 第 99 句 → `btn-tab-2` / `None`
- 第 101 句 → `btn-tab-2` / `None`
- 第 102 句 → `btn-tab-2` / `None`
- 第 103 句 → `btn-tab-2` / `None`
- 第 105 句 → `btn-tab-2` / `None`
- 第 107 句 → `btn-tab-2` / `None`
- 第 110 句 → `btn-tab-2` / `None`
- 第 111 句 → `btn-tab-2` / `None`
- 第 112 句 → `btn-tab-2` / `None`
- 第 113 句 → `btn-tab-3` / `None`
- 第 120 句 → `btn-tab-3` / `None`
- 第 122 句 → `btn-tab-3` / `None`
- 第 123 句 → `btn-tab-3` / `None`
- 第 124 句 → `btn-tab-3` / `None`
- 第 126 句 → `btn-tab-3` / `None`
- 第 129 句 → `btn-tab-3` / `None`
- 第 131 句 → `btn-tab-3` / `None`
- 第 135 句 → `btn-tab-3` / `None`
- 第 140 句 → `btn-tab-3` / `None`
- 第 143 句 → `btn-tab-3` / `None`
- 第 144 句 → `btn-tab-3` / `None`
