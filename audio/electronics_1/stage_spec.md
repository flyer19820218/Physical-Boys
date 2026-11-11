# magnetism_1 stage 規格

由 `tools/voice/lesson_studio/build_lesson.py` 從稿子自動產生，請改稿子或腳本，不要手改 `stage.json`。

- `page`：課程頁 `magnetism_1.html`。
- `cuts`：播到 `＊切頁：<標題>` 時，點 `.tab-button[data-tab=tab]`，再點 `.sub-tab-btn[data-sub=sub]`。標題必須與稿子完全一致（共 8 個）。
- `at`：播到第 N 句（說話行編號，兩位數，與 manifest 的 `id` 相同）時，切到指定 tab／sub（共 37 個）。
- `subs`：該句的字幕顯示字。只放含「N 極／S 極」的句子，把念的字換成畫面字（恩極→N 極、艾斯極→S 極），其餘字不變（共 0 句）。沒列在 `subs` 的句子，字幕直接顯示 `text`。

句號有兩種寫法，不要混用：`id`／`stage.json` 的 key 是兩位數（01–106）；音檔檔名是三位數（`001_yanjun.mp3`–`106_...`），說話者對應 彥君=yanjun、曉臻=xiaozhen、合聲=hesheng。

## cuts

- 導體為什麼會導電？ → `tab1` / `cond`
- 兩個帶電體之間的力到底多大？ → `tab5` / `coul`
- 摩擦起電，電子從哪裡搬到哪裡？ → `tab2` / `fric`
- 感應起電，不碰到也能讓它帶電？ → `tab3` / `induce-neg`
- 接觸起電，兩顆一樣大的球，電荷怎麼分？ → `tab4` / `contact`
- 驗電器怎麼知道物體有沒有電？ → `tab4` / `electro-neg`
- 資優解謎：五道挑戰 → `tab6` / `challenge`
- 今天的重點整理 → `tab1` / `cond`

## at

- 第 01 句 → `tab1` / `cond`
- 第 08 句 → `tab1` / `cond`
- 第 18 句 → `tab5` / `coul`
- 第 19 句 → `tab5` / `coul`
- 第 21 句 → `tab5` / `coul`
- 第 22 句 → `tab5` / `coul`
- 第 28 句 → `tab2` / `fric`
- 第 33 句 → `tab2` / `fric`
- 第 34 句 → `tab2` / `fric`
- 第 37 句 → `tab3` / `induce-neg`
- 第 41 句 → `tab3` / `induce-neg`
- 第 43 句 → `tab3` / `induce-neg`
- 第 45 句 → `tab3` / `induce-neg`
- 第 47 句 → `tab3` / `induce-neg`
- 第 48 句 → `tab3` / `polar`
- 第 50 句 → `tab3` / `polar`
- 第 52 句 → `tab3` / `polar`
- 第 55 句 → `tab3` / `polar`
- 第 57 句 → `tab4` / `contact`
- 第 61 句 → `tab4` / `contact`
- 第 62 句 → `tab4` / `contact`
- 第 65 句 → `tab4` / `contact`
- 第 72 句 → `tab4` / `electro-neg`
- 第 74 句 → `tab4` / `electro-neg`
- 第 76 句 → `tab4` / `electro-neg`
- 第 77 句 → `tab6` / `challenge`
- 第 78 句 → `tab6` / `challenge`
- 第 79 句 → `tab6` / `challenge`
- 第 80 句 → `tab6` / `challenge`
- 第 82 句 → `tab6` / `challenge`
- 第 84 句 → `tab6` / `challenge`
- 第 86 句 → `tab6` / `challenge`
- 第 89 句 → `tab6` / `challenge`
- 第 91 句 → `tab1` / `cond`
- 第 93 句 → `tab5` / `coul`
- 第 95 句 → `tab2` / `fric`
- 第 97 句 → `tab3` / `induce-neg`
