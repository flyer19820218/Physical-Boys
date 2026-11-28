# magnetism_1 stage 規格

由 `tools/voice/lesson_studio/build_lesson.py` 從稿子自動產生，請改稿子或腳本，不要手改 `stage.json`。

- `page`：課程頁 `magnetism_1.html`。
- `cuts`：播到 `＊切頁：<標題>` 時，點 `.tab-button[data-tab=tab]`，再點 `.sub-tab-btn[data-sub=sub]`。標題必須與稿子完全一致（共 5 個）。
- `at`：播到第 N 句（說話行編號，兩位數，與 manifest 的 `id` 相同）時，切到指定 tab／sub（共 31 個）。
- `subs`：該句的字幕顯示字。只放字幕和念的字不同的句子：N 極／S 極（恩極→N 極、艾斯極→S 極）與國字數字轉阿拉伯數字（五十牛頓→50 牛頓），其餘字不變；`pins` 是釘選黃條同樣的轉換（共 33 句）。沒列在 `subs` 的句子，字幕直接顯示 `text`。

句號有兩種寫法，不要混用：`id`／`stage.json` 的 key 是兩位數（01–106）；音檔檔名是三位數（`001_yanjun.mp3`–`106_...`），說話者對應 彥君=yanjun、曉臻=xiaozhen、合聲=hesheng。

## cuts

- 什麼東西才算「有機」？只有生物做得出來的才算嗎？ → `tab1` / `urea`
- 砂糖、麵粉、食鹽都是白色粉末，加熱後誰會被燒黑？ → `tab2` / `char`
- 怎麼知道一種物質裡面有沒有碳和氫？ → `tab3` / `testc`
- 一樣的原子，不一樣的分子？ → `tab4` / `iso`
- 乾餾時冒的煙是什麼？碳還能做什麼？ → `tab5` / `smoke`

## at

- 第 01 句 → `tab1` / `urea`
- 第 10 句 → `tab1` / `urea`
- 第 14 句 → `tab1` / `urea`
- 第 17 句 → `tab1` / `except`
- 第 19 句 → `tab1` / `except`
- 第 22 句 → `tab1` / `except`
- 第 24 句 → `tab1` / `except`
- 第 27 句 → `tab1` / `except`
- 第 33 句 → `tab2` / `char`
- 第 37 句 → `tab2` / `char`
- 第 40 句 → `tab2` / `char`
- 第 42 句 → `tab2` / `distill`
- 第 45 句 → `tab2` / `distill`
- 第 48 句 → `tab2` / `distill`
- 第 53 句 → `tab2` / `products`
- 第 56 句 → `tab2` / `products`
- 第 57 句 → `tab2` / `products`
- 第 59 句 → `tab2` / `products`
- 第 61 句 → `tab2` / `products`
- 第 66 句 → `tab3` / `testc`
- 第 73 句 → `tab3` / `testh`
- 第 75 句 → `tab3` / `testh`
- 第 77 句 → `tab3` / `testh`
- 第 81 句 → `tab4` / `iso`
- 第 88 句 → `tab4` / `props`
- 第 90 句 → `tab4` / `props`
- 第 92 句 → `tab4` / `props`
- 第 95 句 → `tab4` / `props`
- 第 104 句 → `tab5` / `cuo`
- 第 105 句 → `tab5` / `cuo`
- 第 108 句 → `tab5` / `cuso4`
