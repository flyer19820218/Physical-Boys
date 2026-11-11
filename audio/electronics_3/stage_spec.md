# magnetism_1 stage 規格

由 `tools/voice/lesson_studio/build_lesson.py` 從稿子自動產生，請改稿子或腳本，不要手改 `stage.json`。

- `page`：課程頁 `magnetism_1.html`。
- `cuts`：播到 `＊切頁：<標題>` 時，點 `.tab-button[data-tab=tab]`，再點 `.sub-tab-btn[data-sub=sub]`。標題必須與稿子完全一致（共 5 個）。
- `at`：播到第 N 句（說話行編號，兩位數，與 manifest 的 `id` 相同）時，切到指定 tab／sub（共 24 個）。
- `subs`：該句的字幕顯示字。只放含「N 極／S 極」的句子，把念的字換成畫面字（恩極→N 極、艾斯極→S 極），其餘字不變（共 0 句）。沒列在 `subs` 的句子，字幕直接顯示 `text`。

句號有兩種寫法，不要混用：`id`／`stage.json` 的 key 是兩位數（01–106）；音檔檔名是三位數（`001_yanjun.mp3`–`106_...`），說話者對應 彥君=yanjun、曉臻=xiaozhen、合聲=hesheng。

## cuts

- 電流不會用完（串聯：處處相等） → `tab2` / `series`
- 分開走再合起來（並聯：電流相加） → `tab3` / `parallel`
- 剖開電表看內阻（安培計與伏特計） → `tab4` / `wiring`
- 段考會考這樣（三道經典大考題） → `tab5` / `quiz`
- 電子爬得很慢（資優補充：燈為何秒亮） → `tab6` / `speed`

## at

- 第 01 句 → `tab1` / `micro`
- 第 04 句 → `tab1` / `micro`
- 第 06 句 → `tab1` / `micro`
- 第 13 句 → `tab2` / `series`
- 第 22 句 → `tab2` / `series`
- 第 26 句 → `tab3` / `parallel`
- 第 30 句 → `tab3` / `parallel`
- 第 31 句 → `tab3` / `parallel`
- 第 32 句 → `tab3` / `par`
- 第 38 句 → `tab3` / `parallel`
- 第 40 句 → `tab4` / `wiring`
- 第 42 句 → `tab4` / `wiring`
- 第 43 句 → `tab4` / `wiring`
- 第 47 句 → `tab4` / `design`
- 第 48 句 → `tab4` / `design`
- 第 50 句 → `tab5` / `quiz`
- 第 55 句 → `tab5` / `quiz`
- 第 57 句 → `tab5` / `quiz`
- 第 60 句 → `tab5` / `quiz`
- 第 61 句 → `tab5` / `quiz`
- 第 64 句 → `tab5` / `quiz`
- 第 66 句 → `tab6` / `speed`
- 第 68 句 → `tab6` / `speed`
- 第 72 句 → `tab6` / `speed`
