# magnetism_1 stage 規格

由 `tools/voice/lesson_studio/build_lesson.py` 從稿子自動產生，請改稿子或腳本，不要手改 `stage.json`。

- `page`：課程頁 `magnetism_1.html`。
- `cuts`：播到 `＊切頁：<標題>` 時，點 `.tab-button[data-tab=tab]`，再點 `.sub-tab-btn[data-sub=sub]`。標題必須與稿子完全一致（共 7 個）。
- `at`：播到第 N 句（說話行編號，兩位數，與 manifest 的 `id` 相同）時，切到指定 tab／sub（共 55 個）。
- `subs`：該句的字幕顯示字。只放字幕和念的字不同的句子：N 極／S 極（恩極→N 極、艾斯極→S 極）與國字數字轉阿拉伯數字（五十牛頓→50 牛頓），其餘字不變；`pins` 是釘選黃條同樣的轉換（共 73 句）。沒列在 `subs` 的句子，字幕直接顯示 `text`。

句號有兩種寫法，不要混用：`id`／`stage.json` 的 key 是兩位數（01–106）；音檔檔名是三位數（`001_yanjun.mp3`–`106_...`），說話者對應 彥君=yanjun、曉臻=xiaozhen、合聲=hesheng。

## cuts

- 電流會轉彎嗎？ → `tab-current` / `None`
- 電怎麼送到家？ → `tab-grid` / `None`
- 為什麼要升壓？ → `tab-loss` / `None`
- 電費怎麼算？ → `tab-cost` / `None`
- 兩種電壓哪來？ → `tab-wiring` / `wiring-basic`
- 兩百二十伏特怎麼來？ → `tab-wiring` / `wiring-advanced`
- 插座和接地安全 → `tab-wiring` / `wiring-sockets`

## at

- 第 01 句 → `tab-current` / `None`
- 第 07 句 → `tab-current` / `None`
- 第 12 句 → `tab-current` / `None`
- 第 15 句 → `tab-current` / `None`
- 第 17 句 → `tab-current` / `None`
- 第 20 句 → `tab-current` / `None`
- 第 23 句 → `tab-current` / `None`
- 第 24 句 → `tab-current` / `None`
- 第 26 句 → `tab-grid` / `None`
- 第 31 句 → `tab-grid` / `None`
- 第 33 句 → `tab-grid` / `None`
- 第 38 句 → `tab-grid` / `None`
- 第 39 句 → `tab-grid` / `None`
- 第 42 句 → `tab-grid` / `None`
- 第 43 句 → `tab-grid` / `None`
- 第 44 句 → `tab-grid` / `None`
- 第 46 句 → `tab-grid` / `None`
- 第 47 句 → `tab-loss` / `None`
- 第 52 句 → `tab-loss` / `None`
- 第 55 句 → `tab-loss` / `None`
- 第 58 句 → `tab-loss` / `None`
- 第 60 句 → `tab-loss` / `None`
- 第 63 句 → `tab-loss` / `None`
- 第 65 句 → `tab-loss` / `None`
- 第 67 句 → `tab-cost` / `None`
- 第 72 句 → `tab-cost` / `None`
- 第 76 句 → `tab-cost` / `None`
- 第 78 句 → `tab-cost` / `None`
- 第 81 句 → `tab-cost` / `None`
- 第 84 句 → `tab-cost` / `None`
- 第 86 句 → `tab-cost` / `None`
- 第 89 句 → `tab-cost` / `None`
- 第 90 句 → `tab-wiring` / `wiring-basic`
- 第 95 句 → `tab-wiring` / `wiring-basic`
- 第 96 句 → `tab-wiring` / `wiring-basic`
- 第 98 句 → `tab-wiring` / `wiring-basic`
- 第 101 句 → `tab-wiring` / `wiring-basic`
- 第 102 句 → `tab-wiring` / `wiring-basic`
- 第 103 句 → `tab-wiring` / `wiring-basic`
- 第 104 句 → `tab-wiring` / `wiring-basic`
- 第 105 句 → `tab-wiring` / `wiring-advanced`
- 第 107 句 → `tab-wiring` / `wiring-advanced`
- 第 110 句 → `tab-wiring` / `wiring-advanced`
- 第 111 句 → `tab-wiring` / `wiring-advanced`
- 第 113 句 → `tab-wiring` / `wiring-advanced`
- 第 114 句 → `tab-wiring` / `wiring-advanced`
- 第 116 句 → `tab-wiring` / `wiring-sockets`
- 第 120 句 → `tab-wiring` / `wiring-sockets`
- 第 123 句 → `tab-wiring` / `wiring-sockets`
- 第 125 句 → `tab-wiring` / `wiring-sockets`
- 第 126 句 → `tab-wiring` / `wiring-sockets`
- 第 127 句 → `tab-wiring` / `wiring-sockets`
- 第 128 句 → `tab-wiring` / `wiring-sockets`
- 第 130 句 → `tab-wiring` / `wiring-sockets`
- 第 131 句 → `tab-wiring` / `wiring-sockets`
