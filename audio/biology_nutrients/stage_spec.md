# magnetism_1 stage 規格

由 `tools/voice/lesson_studio/build_lesson.py` 從稿子自動產生，請改稿子或腳本，不要手改 `stage.json`。

- `page`：課程頁 `magnetism_1.html`。
- `cuts`：播到 `＊切頁：<標題>` 時，點 `.tab-button[data-tab=tab]`，再點 `.sub-tab-btn[data-sub=sub]`。標題必須與稿子完全一致（共 5 個）。
- `at`：播到第 N 句（說話行編號，兩位數，與 manifest 的 `id` 相同）時，切到指定 tab／sub（共 42 個）。
- `subs`：該句的字幕顯示字。只放字幕和念的字不同的句子：N 極／S 極（恩極→N 極、艾斯極→S 極）與國字數字轉阿拉伯數字（五十牛頓→50 牛頓），其餘字不變；`pins` 是釘選黃條同樣的轉換（共 28 句）。沒列在 `subs` 的句子，字幕直接顯示 `text`。

句號有兩種寫法，不要混用：`id`／`stage.json` 的 key 是兩位數（01–106）；音檔檔名是三位數（`001_yanjun.mp3`–`106_...`），說話者對應 彥君=yanjun、曉臻=xiaozhen、合聲=hesheng。

## cuts

- 吃進去的是什麼？（六大養分） → `lesson-0` / `None`
- 一克，差多少？（食物的熱量） → `lesson-1` / `None`
- 飯裡藏著什麼？（碘液檢驗澱粉） → `lesson-2` / `None`
- 藍色會留下嗎？（本氏液檢驗） → `lesson-3` / `None`
- 標示會騙眼睛？（營養標示與餐盤） → `lesson-4` / `None`

## at

- 第 01 句 → `lesson-0` / `None`
- 第 09 句 → `lesson-0` / `None`
- 第 11 句 → `lesson-0` / `None`
- 第 14 句 → `lesson-0` / `None`
- 第 18 句 → `lesson-0` / `None`
- 第 22 句 → `lesson-0` / `None`
- 第 24 句 → `lesson-0` / `None`
- 第 29 句 → `lesson-0` / `None`
- 第 31 句 → `lesson-0` / `None`
- 第 32 句 → `lesson-0` / `None`
- 第 36 句 → `lesson-1` / `None`
- 第 37 句 → `lesson-1` / `None`
- 第 38 句 → `lesson-1` / `None`
- 第 39 句 → `lesson-1` / `None`
- 第 42 句 → `lesson-1` / `None`
- 第 45 句 → `lesson-1` / `None`
- 第 47 句 → `lesson-1` / `None`
- 第 52 句 → `lesson-2` / `None`
- 第 53 句 → `lesson-2` / `None`
- 第 56 句 → `lesson-2` / `None`
- 第 57 句 → `lesson-2` / `None`
- 第 58 句 → `lesson-2` / `None`
- 第 61 句 → `lesson-2` / `None`
- 第 62 句 → `lesson-2` / `None`
- 第 63 句 → `lesson-2` / `None`
- 第 64 句 → `lesson-2` / `None`
- 第 66 句 → `lesson-2` / `None`
- 第 70 句 → `lesson-3` / `None`
- 第 72 句 → `lesson-3` / `None`
- 第 73 句 → `lesson-3` / `None`
- 第 75 句 → `lesson-3` / `None`
- 第 77 句 → `lesson-3` / `None`
- 第 81 句 → `lesson-3` / `None`
- 第 82 句 → `lesson-3` / `None`
- 第 84 句 → `lesson-3` / `None`
- 第 85 句 → `lesson-3` / `None`
- 第 86 句 → `lesson-3` / `None`
- 第 87 句 → `lesson-3` / `None`
- 第 91 句 → `lesson-4` / `None`
- 第 94 句 → `lesson-4` / `None`
- 第 96 句 → `lesson-4` / `None`
- 第 99 句 → `lesson-4` / `None`
