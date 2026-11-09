# magnetism_1 stage 規格

由 `tools/voice/lesson_studio/build_lesson.py` 從稿子自動產生，請改稿子或設定檔，不要手改 `stage.json`。

- `page`：課程頁 `magnetism_1.html`。
- `cuts`：播到 `＊切頁：<標題>` 時，點 `.tab-button[data-tab=tab]`，再點 `.sub-tab-btn[data-sub=sub]`（sub 為 null 就只切分頁）。標題必須與稿子完全一致（共 5 個）。
- `at`：播到第 N 句（說話行編號，兩位數，與 manifest 的 `id` 相同）時，切到指定 tab／sub（共 48 個）。有 `step` 的，會再點該子頁的第 step 個步驟按鈕。
- `subs`：該句的字幕顯示字。只放含「恩極／艾斯極」的句子，把念的字換成畫面字（恩極→N 極、艾斯極→S 極），其餘字不變（共 29 句）。沒列在 `subs` 的句子，字幕直接顯示 `text`。

句號有兩種寫法，不要混用：`id`／`stage.json` 的 key 是兩位數（01–106）；音檔檔名是三位數（`001_yanjun.mp3`…），說話者對應 彥君=yanjun、曉臻=xiaozhen、合聲=hesheng。

## cuts

- 斷成兩半會怎樣？ → `tab-pole` / `pole-suspend`
- 鐵釘怎麼變磁鐵？ → `tab-mag` / `mag-process`
- 看不見的線？ → `tab-line` / `line-bar`
- 指針為何轉向？ → `tab-compass` / `compass-tangent`
- 地球是大磁鐵？ → `tab-earth` / `earth-surface`

## at

- 第 09 句 → `tab-pole` / `pole-suspend` / 第 1 步
- 第 13 句 → `tab-pole` / `pole-suspend` / 第 2 步
- 第 14 句 → `tab-pole` / `pole-suspend` / 第 4 步
- 第 15 句 → `tab-pole` / `pole-interact` / 第 1 步
- 第 16 句 → `tab-pole` / `pole-interact` / 第 2 步
- 第 18 句 → `tab-pole` / `pole-interact` / 第 1 步
- 第 19 句 → `tab-pole` / `pole-interact` / 第 2 步
- 第 20 句 → `tab-pole` / `pole-interact` / 第 5 步
- 第 21 句 → `tab-pole` / `pole-break` / 第 1 步
- 第 22 句 → `tab-pole` / `pole-break` / 第 2 步
- 第 24 句 → `tab-pole` / `pole-break` / 第 5 步
- 第 26 句 → `tab-mag` / `mag-process` / 第 1 步
- 第 29 句 → `tab-mag` / `mag-process` / 第 1 步
- 第 31 句 → `tab-mag` / `mag-process` / 第 2 步
- 第 36 句 → `tab-mag` / `mag-process` / 第 1 步
- 第 38 句 → `tab-mag` / `mag-process` / 第 2 步
- 第 42 句 → `tab-mag` / `mag-process` / 第 3 步
- 第 44 句 → `tab-mag` / `mag-process` / 第 4 步
- 第 46 句 → `tab-mag` / `mag-process` / 第 5 步
- 第 47 句 → `tab-mag` / `mag-store` / 第 1 步
- 第 52 句 → `tab-mag` / `mag-store` / 第 2 步
- 第 53 句 → `tab-mag` / `mag-store` / 第 3 步
- 第 56 句 → `tab-mag` / `mag-store` / 第 4 步
- 第 58 句 → `tab-mag` / `mag-store` / 第 5 步
- 第 60 句 → `tab-line` / `line-bar` / 第 1 步
- 第 62 句 → `tab-line` / `line-bar` / 第 2 步
- 第 64 句 → `tab-line` / `line-bar` / 第 3 步
- 第 68 句 → `tab-line` / `line-bar` / 第 4 步
- 第 70 句 → `tab-line` / `line-bar` / 第 5 步
- 第 71 句 → `tab-line` / `line-u` / 第 1 步
- 第 72 句 → `tab-line` / `line-u` / 第 3 步
- 第 74 句 → `tab-line` / `line-u` / 第 4 步
- 第 76 句 → `tab-compass` / `compass-tangent` / 第 1 步
- 第 78 句 → `tab-compass` / `compass-tangent` / 第 2 步
- 第 80 句 → `tab-compass` / `compass-tangent` / 第 3 步
- 第 82 句 → `tab-compass` / `compass-space` / 第 1 步
- 第 84 句 → `tab-compass` / `compass-space` / 第 2 步
- 第 85 句 → `tab-compass` / `compass-space` / 第 3 步
- 第 86 句 → `tab-compass` / `compass-space` / 第 4 步
- 第 88 句 → `tab-compass` / `compass-tangent` / 第 4 步
- 第 91 句 → `tab-earth` / `earth-surface` / 第 1 步
- 第 93 句 → `tab-earth` / `earth-surface` / 第 3 步
- 第 95 句 → `tab-earth` / `earth-surface` / 第 2 步
- 第 96 句 → `tab-earth` / `earth-surface` / 第 4 步
- 第 99 句 → `tab-earth` / `earth-core` / 第 1 步
- 第 100 句 → `tab-earth` / `earth-core` / 第 3 步
- 第 101 句 → `tab-earth` / `earth-core` / 第 2 步
- 第 102 句 → `tab-earth` / `earth-core` / 第 4 步
