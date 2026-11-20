# magnetism_1 stage 規格

由 `tools/voice/lesson_studio/build_lesson.py` 從稿子自動產生，請改稿子或腳本，不要手改 `stage.json`。

- `page`：課程頁 `magnetism_1.html`。
- `cuts`：播到 `＊切頁：<標題>` 時，點 `.tab-button[data-tab=tab]`，再點 `.sub-tab-btn[data-sub=sub]`。標題必須與稿子完全一致（共 4 個）。
- `at`：播到第 N 句（說話行編號，兩位數，與 manifest 的 `id` 相同）時，切到指定 tab／sub（共 19 個）。
- `subs`：該句的字幕顯示字。只放字幕和念的字不同的句子：N 極／S 極（恩極→N 極、艾斯極→S 極）與國字數字轉阿拉伯數字（五十牛頓→50 牛頓），其餘字不變；`pins` 是釘選黃條同樣的轉換（共 11 句）。沒列在 `subs` 的句子，字幕直接顯示 `text`。

句號有兩種寫法，不要混用：`id`／`stage.json` 的 key 是兩位數（01–106）；音檔檔名是三位數（`001_yanjun.mp3`–`106_...`），說話者對應 彥君=yanjun、曉臻=xiaozhen、合聲=hesheng。

## cuts

- 海岸線為什麼會移動？ → `btn-tab-0` / `None`
- 陸地怎麼會越來越大？ → `btn-tab-1` / `None`
- 沙灘怎麼不見了？ → `btn-tab-2` / `None`
- 港口蓋好以後，旁邊的沙灘怎麼了？ → `btn-tab-3` / `None`

## at

- 第 01 句 → `btn-tab-0` / `None`
- 第 07 句 → `btn-tab-0` / `None`
- 第 14 句 → `btn-tab-0` / `None`
- 第 18 句 → `btn-tab-0` / `None`
- 第 23 句 → `btn-tab-0` / `None`
- 第 30 句 → `btn-tab-1` / `None`
- 第 40 句 → `btn-tab-1` / `None`
- 第 43 句 → `btn-tab-1` / `None`
- 第 48 句 → `btn-tab-1` / `None`
- 第 54 句 → `btn-tab-2` / `None`
- 第 58 句 → `btn-tab-2` / `None`
- 第 61 句 → `btn-tab-2` / `None`
- 第 63 句 → `btn-tab-2` / `None`
- 第 67 句 → `btn-tab-2` / `None`
- 第 77 句 → `btn-tab-3` / `None`
- 第 82 句 → `btn-tab-3` / `None`
- 第 86 句 → `btn-tab-3` / `None`
- 第 88 句 → `btn-tab-3` / `None`
- 第 92 句 → `btn-tab-3` / `None`
