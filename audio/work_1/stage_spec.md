# magnetism_1 stage 規格

由 `tools/voice/lesson_studio/build_lesson.py` 從稿子自動產生，請改稿子或腳本，不要手改 `stage.json`。

- `page`：課程頁 `magnetism_1.html`。
- `cuts`：播到 `＊切頁：<標題>` 時，點 `.tab-button[data-tab=tab]`，再點 `.sub-tab-btn[data-sub=sub]`。標題必須與稿子完全一致（共 7 個）。
- `at`：播到第 N 句（說話行編號，兩位數，與 manifest 的 `id` 相同）時，切到指定 tab／sub（共 43 個）。
- `subs`：該句的字幕顯示字。只放含「N 極／S 極」的句子，把念的字換成畫面字（恩極→N 極、艾斯極→S 極），其餘字不變（共 0 句）。沒列在 `subs` 的句子，字幕直接顯示 `text`。

句號有兩種寫法，不要混用：`id`／`stage.json` 的 key 是兩位數（01–106）；音檔檔名是三位數（`001_yanjun.mp3`–`106_...`），說話者對應 彥君=yanjun、曉臻=xiaozhen、合聲=hesheng。

## cuts

- 搬了一整天，卻可能沒作功？ → `tab1` / `None`
- 同樣是力，為什麼有的算負的？ → `tab2` / `None`
- 走一百公尺，手作了多少功？ → `tab3` / `None`
- 斜坡省了力，功也省到了嗎？ → `tab4` / `None`
- 這一題，你會漏掉單位嗎？ → `tab5` / `None`
- 同樣爬五樓，誰比較厲害？ → `tab6` / `None`
- 這五題，你真的算得出來嗎？ → `tab7` / `None`

## at

- 第 01 句 → `tab1` / `None`
- 第 07 句 → `tab1` / `None`
- 第 14 句 → `tab1` / `None`
- 第 18 句 → `tab1` / `None`
- 第 22 句 → `tab1` / `None`
- 第 25 句 → `tab2` / `None`
- 第 31 句 → `tab2` / `None`
- 第 33 句 → `tab2` / `None`
- 第 34 句 → `tab2` / `None`
- 第 40 句 → `tab3` / `None`
- 第 44 句 → `tab3` / `None`
- 第 46 句 → `tab3` / `None`
- 第 48 句 → `tab3` / `None`
- 第 49 句 → `tab3` / `None`
- 第 52 句 → `tab3` / `None`
- 第 53 句 → `tab3` / `None`
- 第 56 句 → `tab3` / `None`
- 第 57 句 → `tab3` / `None`
- 第 58 句 → `tab3` / `None`
- 第 59 句 → `tab3` / `None`
- 第 63 句 → `tab4` / `None`
- 第 67 句 → `tab4` / `None`
- 第 69 句 → `tab4` / `None`
- 第 72 句 → `tab4` / `None`
- 第 79 句 → `tab5` / `None`
- 第 83 句 → `tab5` / `None`
- 第 90 句 → `tab5` / `None`
- 第 95 句 → `tab6` / `None`
- 第 103 句 → `tab6` / `None`
- 第 104 句 → `tab6` / `None`
- 第 110 句 → `tab6` / `None`
- 第 113 句 → `tab6` / `None`
- 第 115 句 → `tab7` / `None`
- 第 117 句 → `tab7` / `None`
- 第 119 句 → `tab7` / `None`
- 第 120 句 → `tab7` / `None`
- 第 121 句 → `tab7` / `None`
- 第 123 句 → `tab7` / `None`
- 第 125 句 → `tab7` / `None`
- 第 126 句 → `tab7` / `None`
- 第 127 句 → `tab7` / `None`
- 第 129 句 → `tab7` / `None`
- 第 131 句 → `tab7` / `None`
