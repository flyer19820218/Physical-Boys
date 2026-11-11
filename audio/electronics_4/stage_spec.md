# magnetism_1 stage 規格

由 `tools/voice/lesson_studio/build_lesson.py` 從稿子自動產生，請改稿子或腳本，不要手改 `stage.json`。

- `page`：課程頁 `magnetism_1.html`。
- `cuts`：播到 `＊切頁：<標題>` 時，點 `.tab-button[data-tab=tab]`，再點 `.sub-tab-btn[data-sub=sub]`。標題必須與稿子完全一致（共 6 個）。
- `at`：播到第 N 句（說話行編號，兩位數，與 manifest 的 `id` 相同）時，切到指定 tab／sub（共 39 個）。
- `subs`：該句的字幕顯示字。只放含「N 極／S 極」的句子，把念的字換成畫面字（恩極→N 極、艾斯極→S 極），其餘字不變（共 0 句）。沒列在 `subs` 的句子，字幕直接顯示 `text`。

句號有兩種寫法，不要混用：`id`／`stage.json` 的 key 是兩位數（01–106）；音檔檔名是三位數（`001_yanjun.mp3`–`106_...`），說話者對應 彥君=yanjun、曉臻=xiaozhen、合聲=hesheng。

## cuts

- 電子跑不動的原因（電阻的四個變數） → `tab1` / `None`
- 誰決定電流大小（歐姆定律） → `tab2` / `None`
- 接法換，電阻就換（串並聯的等效電阻） → `tab3` / `None`
- 不是每條都直線（歐姆與非歐姆） → `tab4` / `None`
- 看不見的電阻（測量實戰與考題） → `tab5` / `measure`
- 串並聯綜合考題（先想一想，再看解析） → `tab5` / `quiz`

## at

- 第 01 句 → `tab1` / `None`
- 第 09 句 → `tab1` / `None`
- 第 10 句 → `tab1` / `None`
- 第 13 句 → `tab1` / `None`
- 第 15 句 → `tab1` / `None`
- 第 17 句 → `tab1` / `None`
- 第 19 句 → `tab1` / `None`
- 第 21 句 → `tab1` / `None`
- 第 25 句 → `tab2` / `None`
- 第 29 句 → `tab2` / `None`
- 第 30 句 → `tab2` / `None`
- 第 34 句 → `tab2` / `None`
- 第 36 句 → `tab2` / `None`
- 第 38 句 → `tab2` / `None`
- 第 40 句 → `tab3` / `None`
- 第 45 句 → `tab3` / `None`
- 第 47 句 → `tab3` / `None`
- 第 52 句 → `tab3` / `None`
- 第 55 句 → `tab4` / `None`
- 第 56 句 → `tab4` / `None`
- 第 62 句 → `tab4` / `None`
- 第 70 句 → `tab5` / `measure`
- 第 73 句 → `tab5` / `measure`
- 第 74 句 → `tab5` / `measure`
- 第 76 句 → `tab5` / `measure`
- 第 77 句 → `tab5` / `quiz`
- 第 79 句 → `tab5` / `quiz`
- 第 80 句 → `tab5` / `quiz`
- 第 81 句 → `tab5` / `quiz`
- 第 82 句 → `tab5` / `quiz`
- 第 83 句 → `tab5` / `quiz`
- 第 84 句 → `tab5` / `quiz`
- 第 85 句 → `tab5` / `quiz`
- 第 86 句 → `tab5` / `quiz`
- 第 87 句 → `tab5` / `quiz`
- 第 88 句 → `tab5` / `quiz`
- 第 89 句 → `tab5` / `quiz`
- 第 90 句 → `tab5` / `quiz`
- 第 91 句 → `tab5` / `quiz`
