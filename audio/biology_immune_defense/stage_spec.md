# magnetism_1 stage 規格

由 `tools/voice/lesson_studio/build_lesson.py` 從稿子自動產生，請改稿子或腳本，不要手改 `stage.json`。

- `page`：課程頁 `magnetism_1.html`。
- `cuts`：播到 `＊切頁：<標題>` 時，點 `.tab-button[data-tab=tab]`，再點 `.sub-tab-btn[data-sub=sub]`。標題必須與稿子完全一致（共 5 個）。
- `at`：播到第 N 句（說話行編號，兩位數，與 manifest 的 `id` 相同）時，切到指定 tab／sub（共 33 個）。
- `subs`：該句的字幕顯示字。只放字幕和念的字不同的句子：N 極／S 極（恩極→N 極、艾斯極→S 極）與國字數字轉阿拉伯數字（五十牛頓→50 牛頓），其餘字不變；`pins` 是釘選黃條同樣的轉換（共 8 句）。沒列在 `subs` 的句子，字幕直接顯示 `text`。

句號有兩種寫法，不要混用：`id`／`stage.json` 的 key 是兩位數（01–106）；音檔檔名是三位數（`001_yanjun.mp3`–`106_...`），說話者對應 彥君=yanjun、曉臻=xiaozhen、合聲=hesheng。

## cuts

- 病原體，先擋在外面 → `barrier` / `intact`
- 傷口裡，白血球正在做什麼？ → `phagocytosis` / `s0`
- 紅腫熱痛，圖上看原因 → `inflammation` / `base`
- 同一把鑰匙能打開所有鎖嗎？ → `antibody` / `tips`
- 疫苗，讓身體先練習 → `memory` / `first`

## at

- 第 01 句 → `barrier` / `intact`
- 第 09 句 → `barrier` / `mucosa`
- 第 11 句 → `barrier` / `intact`
- 第 12 句 → `barrier` / `wound`
- 第 16 句 → `barrier` / `mucosa`
- 第 23 句 → `barrier` / `wound`
- 第 25 句 → `phagocytosis` / `s1`
- 第 27 句 → `phagocytosis` / `s2`
- 第 28 句 → `phagocytosis` / `s3`
- 第 29 句 → `phagocytosis` / `s4`
- 第 30 句 → `phagocytosis` / `s5`
- 第 33 句 → `phagocytosis` / `s1`
- 第 36 句 → `phagocytosis` / `s0`
- 第 37 句 → `phagocytosis` / `s1`
- 第 42 句 → `inflammation` / `dil`
- 第 43 句 → `inflammation` / `perm`
- 第 44 句 → `inflammation` / `rec`
- 第 45 句 → `inflammation` / `sym3`
- 第 49 句 → `inflammation` / `all`
- 第 50 句 → `inflammation` / `sym0`
- 第 51 句 → `inflammation` / `sym1`
- 第 52 句 → `inflammation` / `sym2`
- 第 53 句 → `inflammation` / `sym3`
- 第 59 句 → `antibody` / `bind`
- 第 60 句 → `antibody` / `ibind`
- 第 62 句 → `antibody` / `bind`
- 第 64 句 → `antibody` / `ibind`
- 第 66 句 → `antibody` / `assist`
- 第 72 句 → `memory` / `recall`
- 第 73 句 → `memory` / `other`
- 第 75 句 → `memory` / `first`
- 第 76 句 → `memory` / `other`
- 第 78 句 → `memory` / `recall`
