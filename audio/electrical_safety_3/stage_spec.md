# magnetism_1 stage 規格

由 `tools/voice/lesson_studio/build_lesson.py` 從稿子自動產生，請改稿子或腳本，不要手改 `stage.json`。

- `page`：課程頁 `magnetism_1.html`。
- `cuts`：播到 `＊切頁：<標題>` 時，點 `.tab-button[data-tab=tab]`，再點 `.sub-tab-btn[data-sub=sub]`。標題必須與稿子完全一致（共 5 個）。
- `at`：播到第 N 句（說話行編號，兩位數，與 manifest 的 `id` 相同）時，切到指定 tab／sub（共 49 個）。
- `subs`：該句的字幕顯示字。只放字幕和念的字不同的句子：N 極／S 極（恩極→N 極、艾斯極→S 極）與國字數字轉阿拉伯數字（五十牛頓→50 牛頓），其餘字不變；`pins` 是釘選黃條同樣的轉換（共 29 句）。沒列在 `subs` 的句子，字幕直接顯示 `text`。

句號有兩種寫法，不要混用：`id`／`stage.json` 的 key 是兩位數（01–106）；音檔檔名是三位數（`001_yanjun.mp3`–`106_...`），說話者對應 彥君=yanjun、曉臻=xiaozhen、合聲=hesheng。

## cuts

- 電流抄近路？ → `tab-short` / `None`
- 插座插太滿？ → `tab-overload` / `None`
- 電線為何發燙？ → `tab-heat` / `None`
- 誰來踩煞車？ → `tab-protect` / `None`
- 碰到電會怎樣？ → `tab-shock` / `None`

## at

- 第 01 句 → `tab-short` / `None`
- 第 07 句 → `tab-short` / `None`
- 第 10 句 → `tab-short` / `None`
- 第 12 句 → `tab-short` / `None`
- 第 15 句 → `tab-short` / `None`
- 第 18 句 → `tab-short` / `None`
- 第 20 句 → `tab-short` / `None`
- 第 22 句 → `tab-short` / `None`
- 第 25 句 → `tab-overload` / `None`
- 第 30 句 → `tab-overload` / `None`
- 第 32 句 → `tab-overload` / `None`
- 第 34 句 → `tab-overload` / `None`
- 第 36 句 → `tab-overload` / `None`
- 第 39 句 → `tab-overload` / `None`
- 第 40 句 → `tab-overload` / `None`
- 第 41 句 → `tab-overload` / `None`
- 第 42 句 → `tab-overload` / `None`
- 第 43 句 → `tab-overload` / `None`
- 第 46 句 → `tab-heat` / `None`
- 第 50 句 → `tab-heat` / `None`
- 第 53 句 → `tab-heat` / `None`
- 第 55 句 → `tab-heat` / `None`
- 第 58 句 → `tab-heat` / `None`
- 第 60 句 → `tab-heat` / `None`
- 第 62 句 → `tab-heat` / `None`
- 第 64 句 → `tab-heat` / `None`
- 第 66 句 → `tab-heat` / `None`
- 第 69 句 → `tab-heat` / `None`
- 第 72 句 → `tab-heat` / `None`
- 第 77 句 → `tab-protect` / `None`
- 第 81 句 → `tab-protect` / `None`
- 第 83 句 → `tab-protect` / `None`
- 第 86 句 → `tab-protect` / `None`
- 第 88 句 → `tab-protect` / `None`
- 第 92 句 → `tab-protect` / `None`
- 第 93 句 → `tab-protect` / `None`
- 第 95 句 → `tab-protect` / `None`
- 第 96 句 → `tab-protect` / `None`
- 第 97 句 → `tab-protect` / `None`
- 第 98 句 → `tab-protect` / `None`
- 第 100 句 → `tab-shock` / `None`
- 第 103 句 → `tab-shock` / `None`
- 第 106 句 → `tab-shock` / `None`
- 第 109 句 → `tab-shock` / `None`
- 第 113 句 → `tab-shock` / `None`
- 第 115 句 → `tab-shock` / `None`
- 第 117 句 → `tab-shock` / `None`
- 第 119 句 → `tab-shock` / `None`
- 第 121 句 → `tab-shock` / `None`
