# magnetism_1 stage 規格

由 `tools/voice/lesson_studio/build_lesson.py` 從稿子自動產生，請改稿子或腳本，不要手改 `stage.json`。

- `page`：課程頁 `magnetism_1.html`。
- `cuts`：播到 `＊切頁：<標題>` 時，點 `.tab-button[data-tab=tab]`，再點 `.sub-tab-btn[data-sub=sub]`。標題必須與稿子完全一致（共 6 個）。
- `at`：播到第 N 句（說話行編號，兩位數，與 manifest 的 `id` 相同）時，切到指定 tab／sub（共 35 個）。
- `subs`：該句的字幕顯示字。只放字幕和念的字不同的句子：N 極／S 極（恩極→N 極、艾斯極→S 極）與國字數字轉阿拉伯數字（五十牛頓→50 牛頓），其餘字不變；`pins` 是釘選黃條同樣的轉換（共 6 句）。沒列在 `subs` 的句子，字幕直接顯示 `text`。

句號有兩種寫法，不要混用：`id`／`stage.json` 的 key 是兩位數（01–106）；音檔檔名是三位數（`001_yanjun.mp3`–`106_...`），說話者對應 彥君=yanjun、曉臻=xiaozhen、合聲=hesheng。

## cuts

- 植物不吃土（原料與養分） → `plant` / `None`
- 剖開一片葉（葉片構造） → `photo` / `None`
- 陽光變成什麼？（光合作用） → `reaction` / `None`
- 氣孔不是細胞（氣體交換） → `guard` / `None`
- 一片葉，兩個結果（遮光葉片實驗） → `experiment` / `None`
- 證據能說到哪裡？（對照與推論） → `evidence` / `None`

## at

- 第 04 句 → `plant` / `None`
- 第 07 句 → `plant` / `None`
- 第 10 句 → `plant` / `None`
- 第 12 句 → `plant` / `None`
- 第 18 句 → `plant` / `None`
- 第 19 句 → `plant` / `None`
- 第 20 句 → `plant` / `None`
- 第 24 句 → `photo` / `None`
- 第 26 句 → `photo` / `None`
- 第 27 句 → `photo` / `None`
- 第 29 句 → `photo` / `None`
- 第 30 句 → `photo` / `None`
- 第 33 句 → `photo` / `None`
- 第 34 句 → `photo` / `None`
- 第 36 句 → `photo` / `None`
- 第 37 句 → `photo` / `None`
- 第 41 句 → `reaction` / `None`
- 第 55 句 → `reaction` / `None`
- 第 56 句 → `reaction` / `None`
- 第 57 句 → `reaction` / `None`
- 第 61 句 → `guard` / `None`
- 第 64 句 → `guard` / `None`
- 第 66 句 → `guard` / `None`
- 第 71 句 → `guard` / `None`
- 第 75 句 → `experiment` / `None`
- 第 78 句 → `experiment` / `None`
- 第 80 句 → `experiment` / `None`
- 第 81 句 → `experiment` / `None`
- 第 83 句 → `experiment` / `None`
- 第 87 句 → `experiment` / `None`
- 第 88 句 → `experiment` / `None`
- 第 89 句 → `experiment` / `None`
- 第 94 句 → `evidence` / `None`
- 第 98 句 → `evidence` / `None`
- 第 100 句 → `evidence` / `None`
