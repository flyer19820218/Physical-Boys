# magnetism_1 stage 規格

由 `tools/voice/lesson_studio/build_lesson.py` 從稿子自動產生，請改稿子或腳本，不要手改 `stage.json`。

- `page`：課程頁 `magnetism_1.html`。
- `cuts`：播到 `＊切頁：<標題>` 時，點 `.tab-button[data-tab=tab]`，再點 `.sub-tab-btn[data-sub=sub]`。標題必須與稿子完全一致（共 5 個）。
- `at`：播到第 N 句（說話行編號，兩位數，與 manifest 的 `id` 相同）時，切到指定 tab／sub（共 33 個）。
- `subs`：該句的字幕顯示字。只放含「N 極／S 極」的句子，把念的字換成畫面字（恩極→N 極、艾斯極→S 極），其餘字不變（共 0 句）。沒列在 `subs` 的句子，字幕直接顯示 `text`。

句號有兩種寫法，不要混用：`id`／`stage.json` 的 key 是兩位數（01–106）；音檔檔名是三位數（`001_yanjun.mp3`–`106_...`），說話者對應 彥君=yanjun、曉臻=xiaozhen、合聲=hesheng。

## cuts

- 能量會跑去哪？ → `tab1` / `None`
- 彈簧藏著什麼能量？ → `tab2` / `shm`
- 等速轉動，力學能守恆嗎？ → `tab3` / `None`
- 掉下去的能量變成了什麼？ → `tab4` / `None`
- 這五題，你抓得到角度嗎？ → `tab5` / `None`

## at

- 第 01 句 → `tab1` / `None`
- 第 13 句 → `tab1` / `None`
- 第 23 句 → `tab1` / `None`
- 第 26 句 → `tab1` / `None`
- 第 35 句 → `tab2` / `shm`
- 第 40 句 → `tab2` / `shm`
- 第 44 句 → `tab2` / `shm`
- 第 48 句 → `tab2` / `vsp`
- 第 52 句 → `tab2` / `vsp`
- 第 56 句 → `tab2` / `vsp`
- 第 60 句 → `tab2` / `vsp`
- 第 65 句 → `tab2` / `vsp`
- 第 71 句 → `tab3` / `None`
- 第 77 句 → `tab3` / `None`
- 第 79 句 → `tab3` / `None`
- 第 95 句 → `tab4` / `None`
- 第 97 句 → `tab4` / `None`
- 第 103 句 → `tab4` / `None`
- 第 104 句 → `tab4` / `None`
- 第 111 句 → `tab5` / `None`
- 第 117 句 → `tab5` / `None`
- 第 123 句 → `tab5` / `None`
- 第 130 句 → `tab5` / `None`
- 第 132 句 → `tab5` / `None`
- 第 133 句 → `tab5` / `None`
- 第 135 句 → `tab5` / `None`
- 第 136 句 → `tab5` / `None`
- 第 137 句 → `tab5` / `None`
- 第 138 句 → `tab5` / `None`
- 第 140 句 → `tab5` / `None`
- 第 141 句 → `tab5` / `None`
- 第 143 句 → `tab5` / `None`
- 第 144 句 → `tab5` / `None`
