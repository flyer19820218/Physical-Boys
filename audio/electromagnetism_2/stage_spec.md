# magnetism_1 stage 規格

由 `tools/voice/lesson_studio/build_lesson.py` 從稿子自動產生，請改稿子或腳本，不要手改 `stage.json`。

- `page`：課程頁 `magnetism_1.html`。
- `cuts`：播到 `＊切頁：<標題>` 時，點 `.tab-button[data-tab=tab]`，再點 `.sub-tab-btn[data-sub=sub]`。標題必須與稿子完全一致（共 5 個）。
- `at`：播到第 N 句（說話行編號，兩位數，與 manifest 的 `id` 相同）時，切到指定 tab／sub（共 65 個）。
- `subs`：該句的字幕顯示字。只放含「N 極／S 極」的句子，把念的字換成畫面字（恩極→N 極、艾斯極→S 極），其餘字不變（共 9 句）。沒列在 `subs` 的句子，字幕直接顯示 `text`。

句號有兩種寫法，不要混用：`id`／`stage.json` 的 key 是兩位數（01–106）；音檔檔名是三位數（`001_yanjun.mp3`–`106_...`），說話者對應 彥君=yanjun、曉臻=xiaozhen、合聲=hesheng。

## cuts

- 指針為何偏轉？ → `tab-straight` / `st-field`
- 彎一彎會變強？ → `tab-loop` / `loop-shape`
- 像長條磁鐵？ → `tab-solenoid` / `sol-shape`
- 吸起整輛廢車？ → `tab-crane` / `crane-principle`
- 聲音怎麼傳？ → `tab-phone` / `__none__`

## at

- 第 05 句 → `tab-straight` / `st-field`
- 第 06 句 → `tab-straight` / `st-field`
- 第 08 句 → `tab-straight` / `st-field`
- 第 10 句 → `tab-straight` / `st-field`
- 第 12 句 → `tab-straight` / `st-field`
- 第 14 句 → `tab-straight` / `st-field`
- 第 15 句 → `tab-straight` / `st-rule`
- 第 16 句 → `tab-straight` / `st-rule`
- 第 17 句 → `tab-straight` / `st-rule`
- 第 18 句 → `tab-straight` / `st-rule`
- 第 20 句 → `tab-straight` / `st-rule`
- 第 21 句 → `tab-straight` / `st-rule`
- 第 22 句 → `tab-straight` / `st-rule`
- 第 23 句 → `tab-straight` / `st-symbol`
- 第 24 句 → `tab-straight` / `st-symbol`
- 第 25 句 → `tab-straight` / `st-symbol`
- 第 26 句 → `tab-straight` / `st-symbol`
- 第 27 句 → `tab-straight` / `st-symbol`
- 第 29 句 → `tab-loop` / `loop-shape`
- 第 31 句 → `tab-loop` / `loop-shape`
- 第 33 句 → `tab-loop` / `loop-shape`
- 第 35 句 → `tab-loop` / `loop-shape`
- 第 36 句 → `tab-loop` / `loop-rule`
- 第 37 句 → `tab-loop` / `loop-rule`
- 第 39 句 → `tab-loop` / `loop-rule`
- 第 41 句 → `tab-loop` / `loop-rule`
- 第 43 句 → `tab-loop` / `loop-rule`
- 第 44 句 → `tab-loop` / `loop-rule`
- 第 45 句 → `tab-loop` / `loop-rule`
- 第 47 句 → `tab-solenoid` / `sol-shape`
- 第 48 句 → `tab-solenoid` / `sol-shape`
- 第 49 句 → `tab-solenoid` / `sol-shape`
- 第 50 句 → `tab-solenoid` / `sol-shape`
- 第 51 句 → `tab-solenoid` / `sol-shape`
- 第 52 句 → `tab-solenoid` / `sol-field`
- 第 53 句 → `tab-solenoid` / `sol-field`
- 第 54 句 → `tab-solenoid` / `sol-field`
- 第 55 句 → `tab-solenoid` / `sol-field`
- 第 56 句 → `tab-solenoid` / `sol-field`
- 第 57 句 → `tab-solenoid` / `sol-field`
- 第 59 句 → `tab-crane` / `crane-principle`
- 第 60 句 → `tab-crane` / `crane-principle`
- 第 61 句 → `tab-crane` / `crane-principle`
- 第 62 句 → `tab-crane` / `crane-principle`
- 第 63 句 → `tab-crane` / `crane-principle`
- 第 65 句 → `tab-crane` / `crane-principle`
- 第 66 句 → `tab-crane` / `crane-factors`
- 第 68 句 → `tab-crane` / `crane-factors`
- 第 70 句 → `tab-crane` / `crane-factors`
- 第 72 句 → `tab-crane` / `crane-factors`
- 第 73 句 → `tab-crane` / `crane-factors`
- 第 74 句 → `tab-crane` / `crane-factors`
- 第 75 句 → `tab-crane` / `crane-factors`
- 第 76 句 → `tab-phone` / `__none__`
- 第 77 句 → `tab-phone` / `__none__`
- 第 78 句 → `tab-phone` / `__none__`
- 第 79 句 → `tab-phone` / `__none__`
- 第 80 句 → `tab-phone` / `__none__`
- 第 81 句 → `tab-phone` / `__none__`
- 第 82 句 → `tab-phone` / `__none__`
- 第 83 句 → `tab-phone` / `__none__`
- 第 84 句 → `tab-phone` / `__none__`
- 第 85 句 → `tab-phone` / `__none__`
- 第 86 句 → `tab-phone` / `__none__`
- 第 87 句 → `tab-phone` / `__none__`
