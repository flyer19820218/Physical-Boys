# magnetism_1 stage 規格

由 `tools/voice/lesson_studio/build_lesson.py` 從稿子自動產生，請改稿子或腳本，不要手改 `stage.json`。

- `page`：課程頁 `magnetism_1.html`。
- `cuts`：播到 `＊切頁：<標題>` 時，點 `.tab-button[data-tab=tab]`，再點 `.sub-tab-btn[data-sub=sub]`。標題必須與稿子完全一致（共 7 個）。
- `at`：播到第 N 句（說話行編號，兩位數，與 manifest 的 `id` 相同）時，切到指定 tab／sub（共 20 個）。
- `subs`：該句的字幕顯示字。只放含「N 極／S 極」的句子，把念的字換成畫面字（恩極→N 極、艾斯極→S 極），其餘字不變（共 0 句）。沒列在 `subs` 的句子，字幕直接顯示 `text`。

句號有兩種寫法，不要混用：`id`／`stage.json` 的 key 是兩位數（01–106）；音檔檔名是三位數（`001_yanjun.mp3`–`106_...`），說話者對應 彥君=yanjun、曉臻=xiaozhen、合聲=hesheng。

## cuts

- 電路要有哪幾樣（符號與基本元件） → `tab1` / `sym`
- 串聯和並聯（兩種接法的電路長什麼樣） → `tab1` / `sp`
- 電壓就是高度差（水流模型對照） → `tab2` / `water`
- 少一條線就不亮（通路、斷路、短路） → `tab3` / `closed`
- 排法決定了一切（電池與燈泡串並聯） → `tab4` / `battery`
- 電表接錯會燒掉（安培計與伏特計） → `tab5` / `normal`
- 電池也有電阻（資優補充：端電壓） → `tab6` / `ladder`

## at

- 第 01 句 → `tab1` / `sym`
- 第 23 句 → `tab1` / `sp`
- 第 39 句 → `tab2` / `water`
- 第 40 句 → `tab4` / `bulb`
- 第 41 句 → `tab2` / `par`
- 第 42 句 → `tab2` / `def`
- 第 46 句 → `tab2` / `water`
- 第 49 句 → `tab2` / `pot`
- 第 54 句 → `tab3` / `closed`
- 第 56 句 → `tab3` / `open`
- 第 58 句 → `tab3` / `short`
- 第 64 句 → `tab4` / `battery`
- 第 65 句 → `tab4` / `battery`
- 第 66 句 → `tab4` / `bulb`
- 第 70 句 → `tab4` / `quiz`
- 第 83 句 → `tab5` / `ammeter_error`
- 第 85 句 → `tab5` / `voltmeter`
- 第 87 句 → `tab5` / `normal`
- 第 93 句 → `tab5` / `wire`
- 第 106 句 → `tab6` / `ladder`
