# magnetism_1 stage 規格

由 `tools/voice/lesson_studio/build_lesson.py` 從稿子自動產生，請改稿子或腳本，不要手改 `stage.json`。

- `page`：課程頁 `magnetism_1.html`。
- `cuts`：播到 `＊切頁：<標題>` 時，點 `.tab-button[data-tab=tab]`，再點 `.sub-tab-btn[data-sub=sub]`。標題必須與稿子完全一致（共 5 個）。
- `at`：播到第 N 句（說話行編號，兩位數，與 manifest 的 `id` 相同）時，切到指定 tab／sub（共 30 個）。
- `subs`：該句的字幕顯示字。只放字幕和念的字不同的句子：N 極／S 極（恩極→N 極、艾斯極→S 極）與國字數字轉阿拉伯數字（五十牛頓→50 牛頓），其餘字不變；`pins` 是釘選黃條同樣的轉換（共 18 句）。沒列在 `subs` 的句子，字幕直接顯示 `text`。

句號有兩種寫法，不要混用：`id`／`stage.json` 的 key 是兩位數（01–106）；音檔檔名是三位數（`001_yanjun.mp3`–`106_...`），說話者對應 彥君=yanjun、曉臻=xiaozhen、合聲=hesheng。

## cuts

- 純水為什麼不導電？ → `tab-intro` / `None`
- 水也能被電拆開？ → `tab-water` / `None`
- 藍色為什麼變淡？ → `tab-cuso4-c` / `None`
- 藍色為什麼不變？ → `tab-cuso4-cu` / `None`
- 湯匙怎麼變銅色？ → `tab-plating` / `None`

## at

- 第 11 句 → `tab-intro` / `None`
- 第 14 句 → `tab-intro` / `None`
- 第 17 句 → `tab-intro` / `None`
- 第 20 句 → `tab-intro` / `None`
- 第 23 句 → `tab-intro` / `None`
- 第 26 句 → `tab-intro` / `None`
- 第 40 句 → `tab-water` / `None`
- 第 43 句 → `tab-water` / `None`
- 第 47 句 → `tab-water` / `None`
- 第 51 句 → `tab-water` / `None`
- 第 55 句 → `tab-water` / `None`
- 第 59 句 → `tab-water` / `None`
- 第 75 句 → `tab-cuso4-c` / `None`
- 第 78 句 → `tab-cuso4-c` / `None`
- 第 79 句 → `tab-cuso4-c` / `None`
- 第 82 句 → `tab-cuso4-c` / `None`
- 第 85 句 → `tab-cuso4-c` / `None`
- 第 89 句 → `tab-cuso4-c` / `None`
- 第 100 句 → `tab-cuso4-cu` / `None`
- 第 103 句 → `tab-cuso4-cu` / `None`
- 第 104 句 → `tab-cuso4-cu` / `None`
- 第 105 句 → `tab-cuso4-cu` / `None`
- 第 107 句 → `tab-cuso4-cu` / `None`
- 第 111 句 → `tab-cuso4-cu` / `None`
- 第 123 句 → `tab-plating` / `None`
- 第 128 句 → `tab-plating` / `None`
- 第 130 句 → `tab-plating` / `None`
- 第 132 句 → `tab-plating` / `None`
- 第 133 句 → `tab-plating` / `None`
- 第 135 句 → `tab-plating` / `None`
