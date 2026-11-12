# magnetism_1 stage 規格

由 `tools/voice/lesson_studio/build_lesson.py` 從稿子自動產生，請改稿子或腳本，不要手改 `stage.json`。

- `page`：課程頁 `magnetism_1.html`。
- `cuts`：播到 `＊切頁：<標題>` 時，點 `.tab-button[data-tab=tab]`，再點 `.sub-tab-btn[data-sub=sub]`。標題必須與稿子完全一致（共 5 個）。
- `at`：播到第 N 句（說話行編號，兩位數，與 manifest 的 `id` 相同）時，切到指定 tab／sub（共 32 個）。
- `subs`：該句的字幕顯示字。只放含「N 極／S 極」的句子，把念的字換成畫面字（恩極→N 極、艾斯極→S 極），其餘字不變（共 0 句）。沒列在 `subs` 的句子，字幕直接顯示 `text`。

句號有兩種寫法，不要混用：`id`／`stage.json` 的 key 是兩位數（01–106）；音檔檔名是三位數（`001_yanjun.mp3`–`106_...`），說話者對應 彥君=yanjun、曉臻=xiaozhen、合聲=hesheng。

## cuts

- 時速加倍，為什麼就是煞不住？ → `tab1` / `None`
- 爬上去的力氣，跑到哪裡去了？ → `tab2` / `None`
- 壓得越深，為什麼衝得越快？ → `tab3` / `None`
- 換單位這一步，你敢跳過嗎？ → `tab4` / `None`
- 這五題，你真的算得出來嗎？ → `tab5` / `None`

## at

- 第 01 句 → `tab1` / `None`
- 第 19 句 → `tab1` / `None`
- 第 22 句 → `tab1` / `None`
- 第 24 句 → `tab1` / `None`
- 第 26 句 → `tab1` / `None`
- 第 30 句 → `tab1` / `None`
- 第 31 句 → `tab1` / `None`
- 第 35 句 → `tab2` / `None`
- 第 49 句 → `tab2` / `None`
- 第 52 句 → `tab2` / `None`
- 第 56 句 → `tab2` / `None`
- 第 60 句 → `tab2` / `None`
- 第 64 句 → `tab3` / `None`
- 第 75 句 → `tab3` / `None`
- 第 77 句 → `tab3` / `None`
- 第 79 句 → `tab3` / `None`
- 第 80 句 → `tab3` / `None`
- 第 83 句 → `tab3` / `None`
- 第 88 句 → `tab4` / `None`
- 第 94 句 → `tab4` / `None`
- 第 99 句 → `tab4` / `None`
- 第 104 句 → `tab5` / `None`
- 第 106 句 → `tab5` / `None`
- 第 107 句 → `tab5` / `None`
- 第 109 句 → `tab5` / `None`
- 第 110 句 → `tab5` / `None`
- 第 112 句 → `tab5` / `None`
- 第 113 句 → `tab5` / `None`
- 第 115 句 → `tab5` / `None`
- 第 116 句 → `tab5` / `None`
- 第 118 句 → `tab5` / `None`
- 第 119 句 → `tab5` / `None`
