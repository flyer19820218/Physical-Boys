# magnetism_1 stage 規格

由 `tools/voice/lesson_studio/build_lesson.py` 從稿子自動產生，請改稿子或腳本，不要手改 `stage.json`。

- `page`：課程頁 `magnetism_1.html`。
- `cuts`：播到 `＊切頁：<標題>` 時，點 `.tab-button[data-tab=tab]`，再點 `.sub-tab-btn[data-sub=sub]`。標題必須與稿子完全一致（共 5 個）。
- `at`：播到第 N 句（說話行編號，兩位數，與 manifest 的 `id` 相同）時，切到指定 tab／sub（共 6 個）。
- `subs`：該句的字幕顯示字。只放含「N 極／S 極」的句子，把念的字換成畫面字（恩極→N 極、艾斯極→S 極），其餘字不變（共 29 句）。沒列在 `subs` 的句子，字幕直接顯示 `text`。

句號有兩種寫法，不要混用：`id`／`stage.json` 的 key 是兩位數（01–106）；音檔檔名是三位數（`001_yanjun.mp3`–`106_...`），說話者對應 彥君=yanjun、曉臻=xiaozhen、合聲=hesheng。

## cuts

- 斷成兩半會怎樣？ → `tab-pole` / `pole-suspend`
- 鐵釘怎麼變磁鐵？ → `tab-mag` / `mag-process`
- 看不見的線？ → `tab-line` / `line-bar`
- 指針為何轉向？ → `tab-compass` / `compass-tangent`
- 地球是大磁鐵？ → `tab-earth` / `earth-surface`

## at

- 第 15 句 → `tab-pole` / `pole-interact`
- 第 21 句 → `tab-pole` / `pole-break`
- 第 55 句 → `tab-mag` / `mag-store`
- 第 71 句 → `tab-line` / `line-u`
- 第 84 句 → `tab-compass` / `compass-space`
- 第 99 句 → `tab-earth` / `earth-core`
