# magnetism_1 stage 規格

由 `tools/voice/lesson_studio/build_lesson.py` 從稿子自動產生，請改稿子或腳本，不要手改 `stage.json`。

- `page`：課程頁 `magnetism_1.html`。
- `cuts`：播到 `＊切頁：<標題>` 時，點 `.tab-button[data-tab=tab]`，再點 `.sub-tab-btn[data-sub=sub]`。標題必須與稿子完全一致（共 5 個）。
- `at`：播到第 N 句（說話行編號，兩位數，與 manifest 的 `id` 相同）時，切到指定 tab／sub（共 39 個）。
- `subs`：該句的字幕顯示字。只放字幕和念的字不同的句子：N 極／S 極（恩極→N 極、艾斯極→S 極）與國字數字轉阿拉伯數字（五十牛頓→50 牛頓），其餘字不變；`pins` 是釘選黃條同樣的轉換（共 50 句）。沒列在 `subs` 的句子，字幕直接顯示 `text`。

句號有兩種寫法，不要混用：`id`／`stage.json` 的 key 是兩位數（01–106）；音檔檔名是三位數（`001_yanjun.mp3`–`106_...`），說話者對應 彥君=yanjun、曉臻=xiaozhen、合聲=hesheng。

## cuts

- 走在健康步道上痛得哇哇叫，躺釘床卻不會受傷？ → `tab1` / `pdef`
- 潛水艇為什麼不能無限下潛？ → `tab2` / `depth`
- 水塔為什麼要蓋在最高處？ → `tab3` / `level`
- 輕輕一壓，就能舉起整輛汽車？ → `tab4` / `transmit`
- 潛到四十公尺，空氣球會被壓成多小？ → `tab5` / `total`

## at

- 第 01 句 → `tab1` / `pdef`
- 第 09 句 → `tab1` / `pdef`
- 第 12 句 → `tab1` / `pdef`
- 第 15 句 → `tab1` / `pdef`
- 第 18 句 → `tab1` / `brick`
- 第 21 句 → `tab1` / `brick`
- 第 23 句 → `tab1` / `brick`
- 第 32 句 → `tab2` / `depth`
- 第 33 句 → `tab2` / `depth`
- 第 35 句 → `tab2` / `depth`
- 第 38 句 → `tab2` / `depth`
- 第 41 句 → `tab2` / `shape`
- 第 43 句 → `tab2` / `shape`
- 第 44 句 → `tab2` / `shape`
- 第 46 句 → `tab2` / `seal`
- 第 49 句 → `tab2` / `seal`
- 第 51 句 → `tab2` / `seal`
- 第 55 句 → `tab2` / `seal`
- 第 58 句 → `tab2` / `seal`
- 第 61 句 → `tab3` / `level`
- 第 63 句 → `tab3` / `level`
- 第 64 句 → `tab3` / `level`
- 第 66 句 → `tab3` / `app`
- 第 68 句 → `tab3` / `app`
- 第 70 句 → `tab3` / `app`
- 第 71 句 → `tab3` / `app`
- 第 79 句 → `tab4` / `transmit`
- 第 80 句 → `tab4` / `transmit`
- 第 82 句 → `tab4` / `transmit`
- 第 85 句 → `tab4` / `jack`
- 第 88 句 → `tab4` / `jack`
- 第 91 句 → `tab4` / `work`
- 第 93 句 → `tab4` / `work`
- 第 97 句 → `tab4` / `work`
- 第 103 句 → `tab5` / `total`
- 第 104 句 → `tab5` / `total`
- 第 108 句 → `tab5` / `utube`
- 第 110 句 → `tab5` / `utube`
- 第 114 句 → `tab5` / `utube`
