# magnetism_1 stage 規格

由 `tools/voice/lesson_studio/build_lesson.py` 從稿子自動產生，請改稿子或腳本，不要手改 `stage.json`。

- `page`：課程頁 `magnetism_1.html`。
- `cuts`：播到 `＊切頁：<標題>` 時，點 `.tab-button[data-tab=tab]`，再點 `.sub-tab-btn[data-sub=sub]`。標題必須與稿子完全一致（共 5 個）。
- `at`：播到第 N 句（說話行編號，兩位數，與 manifest 的 `id` 相同）時，切到指定 tab／sub（共 26 個）。
- `subs`：該句的字幕顯示字。只放字幕和念的字不同的句子：N 極／S 極（恩極→N 極、艾斯極→S 極）與國字數字轉阿拉伯數字（五十牛頓→50 牛頓），其餘字不變；`pins` 是釘選黃條同樣的轉換（共 20 句）。沒列在 `subs` 的句子，字幕直接顯示 `text`。

句號有兩種寫法，不要混用：`id`／`stage.json` 的 key 是兩位數（01–106）；音檔檔名是三位數（`001_yanjun.mp3`–`106_...`），說話者對應 彥君=yanjun、曉臻=xiaozhen、合聲=hesheng。

## cuts

- 不吃掉的幫手（分解與合成） → `model` / `None`
- 誰能對上？（酵素的專一性） → `specificity` / `None`
- 愈熱愈快嗎？（溫度與活性） → `temperature` / `None`
- 胃裡能工作嗎？（酸鹼與活性） → `ph` / `None`
- 煮過就不一樣？（唾液澱粉酶實驗） → `experiment` / `None`

## at

- 第 11 句 → `model` / `None`
- 第 12 句 → `model` / `None`
- 第 14 句 → `model` / `None`
- 第 18 句 → `model` / `None`
- 第 19 句 → `model` / `None`
- 第 28 句 → `specificity` / `None`
- 第 31 句 → `specificity` / `None`
- 第 34 句 → `specificity` / `None`
- 第 36 句 → `specificity` / `None`
- 第 38 句 → `specificity` / `None`
- 第 39 句 → `specificity` / `None`
- 第 45 句 → `temperature` / `None`
- 第 48 句 → `temperature` / `None`
- 第 52 句 → `temperature` / `None`
- 第 58 句 → `temperature` / `None`
- 第 61 句 → `temperature` / `None`
- 第 67 句 → `ph` / `None`
- 第 69 句 → `ph` / `None`
- 第 71 句 → `ph` / `None`
- 第 73 句 → `ph` / `None`
- 第 75 句 → `ph` / `None`
- 第 81 句 → `experiment` / `None`
- 第 82 句 → `experiment` / `None`
- 第 90 句 → `experiment` / `None`
- 第 91 句 → `experiment` / `None`
- 第 94 句 → `experiment` / `None`
