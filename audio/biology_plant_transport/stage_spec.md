# magnetism_1 stage 規格

由 `tools/voice/lesson_studio/build_lesson.py` 從稿子自動產生，請改稿子或腳本，不要手改 `stage.json`。

- `page`：課程頁 `magnetism_1.html`。
- `cuts`：播到 `＊切頁：<標題>` 時，點 `.tab-button[data-tab=tab]`，再點 `.sub-tab-btn[data-sub=sub]`。標題必須與稿子完全一致（共 5 個）。
- `at`：播到第 N 句（說話行編號，兩位數，與 manifest 的 `id` 相同）時，切到指定 tab／sub（共 21 個）。
- `subs`：該句的字幕顯示字。只放字幕和念的字不同的句子：N 極／S 極（恩極→N 極、艾斯極→S 極）與國字數字轉阿拉伯數字（五十牛頓→50 牛頓），其餘字不變；`pins` 是釘選黃條同樣的轉換（共 3 句）。沒列在 `subs` 的句子，字幕直接顯示 `text`。

句號有兩種寫法，不要混用：`id`／`stage.json` 的 key 是兩位數（01–106）；音檔檔名是三位數（`001_yanjun.mp3`–`106_...`），說話者對應 彥君=yanjun、曉臻=xiaozhen、合聲=hesheng。

## cuts

- 養分今天送去哪裡？ → `sourceSink` / `None`
- 根毛怎麼吸到水？ → `rootHair` / `None`
- 水怎麼爬上高樹？ → `transpiration` / `None`
- 紅色染液走哪條路？ → `celeryLab` / `None`
- 讓整株植物動起來 → `wholePlant` / `None`

## at

- 第 01 句 → `sourceSink` / `None`
- 第 10 句 → `sourceSink` / `None`
- 第 19 句 → `rootHair` / `None`
- 第 26 句 → `rootHair` / `None`
- 第 28 句 → `rootHair` / `None`
- 第 33 句 → `rootHair` / `None`
- 第 37 句 → `rootHair` / `None`
- 第 39 句 → `rootHair` / `None`
- 第 43 句 → `transpiration` / `None`
- 第 57 句 → `transpiration` / `None`
- 第 59 句 → `transpiration` / `None`
- 第 60 句 → `transpiration` / `None`
- 第 62 句 → `transpiration` / `None`
- 第 65 句 → `celeryLab` / `None`
- 第 73 句 → `celeryLab` / `None`
- 第 74 句 → `celeryLab` / `None`
- 第 75 句 → `celeryLab` / `None`
- 第 81 句 → `celeryLab` / `None`
- 第 83 句 → `wholePlant` / `None`
- 第 88 句 → `wholePlant` / `None`
- 第 92 句 → `wholePlant` / `None`
