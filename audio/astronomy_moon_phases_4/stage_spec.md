# magnetism_1 stage 規格

由 `tools/voice/lesson_studio/build_lesson.py` 從稿子自動產生，請改稿子或腳本，不要手改 `stage.json`。

- `page`：課程頁 `magnetism_1.html`。
- `cuts`：播到 `＊切頁：<標題>` 時，點 `.tab-button[data-tab=tab]`，再點 `.sub-tab-btn[data-sub=sub]`。標題必須與稿子完全一致（共 4 個）。
- `at`：播到第 N 句（說話行編號，兩位數，與 manifest 的 `id` 相同）時，切到指定 tab／sub（共 18 個）。
- `subs`：該句的字幕顯示字。只放字幕和念的字不同的句子：N 極／S 極（恩極→N 極、艾斯極→S 極）與國字數字轉阿拉伯數字（五十牛頓→50 牛頓），其餘字不變；`pins` 是釘選黃條同樣的轉換（共 22 句）。沒列在 `subs` 的句子，字幕直接顯示 `text`。

句號有兩種寫法，不要混用：`id`／`stage.json` 的 key 是兩位數（01–106）；音檔檔名是三位數（`001_yanjun.mp3`–`106_...`），說話者對應 彥君=yanjun、曉臻=xiaozhen、合聲=hesheng。

## cuts

- 月亮為何會變臉？ → `btn-tab-0` / `None`
- 誰擋住了太陽？ → `btn-tab-1` / `None`
- 月亮為何變紅？ → `btn-tab-2` / `None`
- 海水為何漲又退？ → `btn-tab-3` / `None`

## at

- 第 01 句 → `btn-tab-0` / `None`
- 第 07 句 → `btn-tab-0` / `None`
- 第 11 句 → `btn-tab-0` / `None`
- 第 16 句 → `btn-tab-0` / `None`
- 第 22 句 → `btn-tab-0` / `None`
- 第 24 句 → `btn-tab-0` / `None`
- 第 26 句 → `btn-tab-0` / `None`
- 第 27 句 → `btn-tab-0` / `None`
- 第 29 句 → `btn-tab-0` / `None`
- 第 36 句 → `btn-tab-1` / `None`
- 第 46 句 → `btn-tab-1` / `None`
- 第 48 句 → `btn-tab-1` / `None`
- 第 52 句 → `btn-tab-2` / `None`
- 第 57 句 → `btn-tab-2` / `None`
- 第 63 句 → `btn-tab-2` / `None`
- 第 69 句 → `btn-tab-3` / `None`
- 第 78 句 → `btn-tab-3` / `None`
- 第 84 句 → `btn-tab-3` / `None`
