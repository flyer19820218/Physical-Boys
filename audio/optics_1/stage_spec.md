# magnetism_1 stage 規格

由 `tools/voice/lesson_studio/build_lesson.py` 從稿子自動產生，請改稿子或腳本，不要手改 `stage.json`。

- `page`：課程頁 `magnetism_1.html`。
- `cuts`：播到 `＊切頁：<標題>` 時，點 `.tab-button[data-tab=tab]`，再點 `.sub-tab-btn[data-sub=sub]`。標題必須與稿子完全一致（共 4 個）。
- `at`：播到第 N 句（說話行編號，兩位數，與 manifest 的 `id` 相同）時，切到指定 tab／sub（共 20 個）。
- `subs`：該句的字幕顯示字。只放字幕和念的字不同的句子：N 極／S 極（恩極→N 極、艾斯極→S 極）與國字數字轉阿拉伯數字（五十牛頓→50 牛頓），其餘字不變；`pins` 是釘選黃條同樣的轉換（共 25 句）。沒列在 `subs` 的句子，字幕直接顯示 `text`。

句號有兩種寫法，不要混用：`id`／`stage.json` 的 key 是兩位數（01–106）；音檔檔名是三位數（`001_yanjun.mp3`–`106_...`），說話者對應 彥君=yanjun、曉臻=xiaozhen、合聲=hesheng。

## cuts

- 路燈下的影子，為什麼有時清楚、有時糊糊的？ → `shadow` / `None`
- 從小圓孔看出去，世界為什麼上下顛倒？ → `pinhole` / `None`
- 針孔靠近物體，牆上的像會變大還是變小？ → `quiz` / `None`
- 回頭整理：今天學了什麼？ → `shadow` / `None`

## at

- 第 01 句 → `shadow` / `None`
- 第 06 句 → `shadow` / `None`
- 第 13 句 → `shadow` / `None`
- 第 19 句 → `shadow` / `None`
- 第 23 句 → `shadow` / `None`
- 第 26 句 → `shadow` / `None`
- 第 32 句 → `pinhole` / `None`
- 第 40 句 → `pinhole` / `None`
- 第 45 句 → `pinhole` / `None`
- 第 49 句 → `pinhole` / `None`
- 第 55 句 → `pinhole` / `None`
- 第 57 句 → `pinhole` / `None`
- 第 60 句 → `pinhole` / `None`
- 第 68 句 → `quiz` / `None`
- 第 72 句 → `quiz` / `None`
- 第 76 句 → `quiz` / `None`
- 第 84 句 → `quiz` / `None`
- 第 87 句 → `shadow` / `None`
- 第 88 句 → `pinhole` / `None`
- 第 89 句 → `pinhole` / `None`
