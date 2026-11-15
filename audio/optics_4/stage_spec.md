# magnetism_1 stage 規格

由 `tools/voice/lesson_studio/build_lesson.py` 從稿子自動產生，請改稿子或腳本，不要手改 `stage.json`。

- `page`：課程頁 `magnetism_1.html`。
- `cuts`：播到 `＊切頁：<標題>` 時，點 `.tab-button[data-tab=tab]`，再點 `.sub-tab-btn[data-sub=sub]`。標題必須與稿子完全一致（共 6 個）。
- `at`：播到第 N 句（說話行編號，兩位數，與 manifest 的 `id` 相同）時，切到指定 tab／sub（共 9 個）。
- `subs`：該句的字幕顯示字。只放字幕和念的字不同的句子：N 極／S 極（恩極→N 極、艾斯極→S 極）與國字數字轉阿拉伯數字（五十牛頓→50 牛頓），其餘字不變；`pins` 是釘選黃條同樣的轉換（共 19 句）。沒列在 `subs` 的句子，字幕直接顯示 `text`。

句號有兩種寫法，不要混用：`id`／`stage.json` 的 key 是兩位數（01–106）；音檔檔名是三位數（`001_yanjun.mp3`–`106_...`），說話者對應 彥君=yanjun、曉臻=xiaozhen、合聲=hesheng。

## cuts

- 透鏡為什麼會聚或發散？ → `intro` / `intro`
- 凸透鏡把像成在哪裡？ → `convex` / `convex`
- 立體凸透鏡看板實驗室 → `lab3d` / `lab3d`
- 遠視為什麼需要凸透鏡？ → `hyperopia` / `hyperopia`
- 凹透鏡為什麼只成虛像？ → `concave` / `concave`
- 近視為什麼需要凹透鏡？ → `myopia` / `myopia`

## at

- 第 01 句 → `intro` / `intro`
- 第 07 句 → `intro` / `intro`
- 第 20 句 → `convex` / `convex`
- 第 36 句 → `convex` / `convex`
- 第 45 句 → `lab3d` / `lab3d`
- 第 49 句 → `lab3d` / `lab3d`
- 第 62 句 → `hyperopia` / `hyperopia`
- 第 72 句 → `concave` / `concave`
- 第 86 句 → `myopia` / `myopia`
