# magnetism_1 stage 規格

由 `tools/voice/lesson_studio/build_lesson.py` 從稿子自動產生，請改稿子或腳本，不要手改 `stage.json`。

- `page`：課程頁 `magnetism_1.html`。
- `cuts`：播到 `＊切頁：<標題>` 時，點 `.tab-button[data-tab=tab]`，再點 `.sub-tab-btn[data-sub=sub]`。標題必須與稿子完全一致（共 8 個）。
- `at`：播到第 N 句（說話行編號，兩位數，與 manifest 的 `id` 相同）時，切到指定 tab／sub（共 23 個）。
- `subs`：該句的字幕顯示字。只放含「N 極／S 極」的句子，把念的字換成畫面字（恩極→N 極、艾斯極→S 極），其餘字不變（共 3 句）。沒列在 `subs` 的句子，字幕直接顯示 `text`。

句號有兩種寫法，不要混用：`id`／`stage.json` 的 key 是兩位數（01–106）；音檔檔名是三位數（`001_yanjun.mp3`–`106_...`），說話者對應 彥君=yanjun、曉臻=xiaozhen、合聲=hesheng。

## cuts

- 磁鐵裡藏了電池？ → `history` / `faraday-story`
- 冷次定律：感應電流在反抗什麼？ → `history` / `lenz-law`
- 直流、交流差在哪？ → `generator` / `dc-motor-review`
- 交流發電機為什麼是交流？ → `generator` / `ac-generator-model`
- 變壓器怎麼變電壓？ → `transformer` / `trans-basic`
- 資優補充：電壓為什麼慢四分之一週期？ → `transformer` / `trans-gifted`
- 資優補充：感應電流為什麼有時同向？ → `transformer` / `trans-gifted`
- 沒有火怎麼煮水？ → `cooker` / `None`

## at

- 第 07 句 → `history` / `faraday-story`
- 第 10 句 → `history` / `faraday-story`
- 第 12 句 → `history` / `faraday-story`
- 第 16 句 → `history` / `lenz-law`
- 第 18 句 → `history` / `lenz-law`
- 第 20 句 → `history` / `lenz-law`
- 第 23 句 → `history` / `lenz-law`
- 第 28 句 → `generator` / `dc-motor-review`
- 第 32 句 → `generator` / `dc-motor-review`
- 第 35 句 → `generator` / `dc-motor-review`
- 第 36 句 → `generator` / `ac-generator-model`
- 第 38 句 → `generator` / `ac-generator-model`
- 第 40 句 → `generator` / `ac-generator-model`
- 第 42 句 → `generator` / `ac-generator-model`
- 第 48 句 → `transformer` / `trans-basic`
- 第 50 句 → `transformer` / `trans-basic`
- 第 53 句 → `transformer` / `trans-basic`
- 第 54 句 → `transformer` / `trans-basic`
- 第 60 句 → `transformer` / `trans-basic`
- 第 77 句 → `cooker` / `None`
- 第 78 句 → `cooker` / `None`
- 第 80 句 → `cooker` / `None`
- 第 81 句 → `cooker` / `None`
