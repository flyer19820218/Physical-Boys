# magnetism_1 stage 規格

由 `tools/voice/lesson_studio/build_lesson.py` 從稿子自動產生，請改稿子或腳本，不要手改 `stage.json`。

- `page`：課程頁 `magnetism_1.html`。
- `cuts`：播到 `＊切頁：<標題>` 時，點 `.tab-button[data-tab=tab]`，再點 `.sub-tab-btn[data-sub=sub]`。標題必須與稿子完全一致（共 6 個）。
- `at`：播到第 N 句（說話行編號，兩位數，與 manifest 的 `id` 相同）時，切到指定 tab／sub（共 30 個）。
- `subs`：該句的字幕顯示字。只放字幕和念的字不同的句子：N 極／S 極（恩極→N 極、艾斯極→S 極）與國字數字轉阿拉伯數字（五十牛頓→50 牛頓），其餘字不變；`pins` 是釘選黃條同樣的轉換（共 22 句）。沒列在 `subs` 的句子，字幕直接顯示 `text`。

句號有兩種寫法，不要混用：`id`／`stage.json` 的 key 是兩位數（01–106）；音檔檔名是三位數（`001_yanjun.mp3`–`106_...`），說話者對應 彥君=yanjun、曉臻=xiaozhen、合聲=hesheng。

## cuts

- 鏡子裡的魔法（互動魔鏡遊戲） → `playground` / `playground`
- 光怎麼彈？（反射定律雷射槍） → `plane_and_reflection` / `reflection`
- 虛像在哪裡？（平面鏡光路圖） → `plane_and_reflection` / `plane_mirror`
- 曲面鏡的視野（凸面鏡與凹面鏡） → `curved_mirror` / `curved_mirror`
- 全身鏡迷思（鏡子要多長） → `applications` / `full_body`
- 三面鏡運動（相對運動大魔王） → `applications` / `three_mirrors`

## at

- 第 01 句 → `playground` / `playground`
- 第 07 句 → `playground` / `playground`
- 第 12 句 → `playground` / `playground`
- 第 14 句 → `playground` / `playground`
- 第 16 句 → `playground` / `playground`
- 第 20 句 → `playground` / `playground`
- 第 22 句 → `playground` / `playground`
- 第 23 句 → `plane_and_reflection` / `reflection`
- 第 30 句 → `plane_and_reflection` / `reflection`
- 第 32 句 → `plane_and_reflection` / `reflection`
- 第 34 句 → `plane_and_reflection` / `reflection`
- 第 36 句 → `plane_and_reflection` / `reflection`
- 第 41 句 → `plane_and_reflection` / `plane_mirror`
- 第 46 句 → `plane_and_reflection` / `plane_mirror`
- 第 48 句 → `plane_and_reflection` / `plane_mirror`
- 第 50 句 → `plane_and_reflection` / `plane_mirror`
- 第 57 句 → `curved_mirror` / `curved_mirror`
- 第 60 句 → `curved_mirror` / `curved_mirror`
- 第 66 句 → `curved_mirror` / `curved_mirror`
- 第 68 句 → `curved_mirror` / `curved_mirror`
- 第 72 句 → `curved_mirror` / `curved_mirror`
- 第 75 句 → `applications` / `full_body`
- 第 80 句 → `applications` / `full_body`
- 第 82 句 → `applications` / `full_body`
- 第 84 句 → `applications` / `full_body`
- 第 90 句 → `applications` / `three_mirrors`
- 第 95 句 → `applications` / `three_mirrors`
- 第 99 句 → `applications` / `three_mirrors`
- 第 101 句 → `applications` / `three_mirrors`
- 第 103 句 → `applications` / `three_mirrors`
