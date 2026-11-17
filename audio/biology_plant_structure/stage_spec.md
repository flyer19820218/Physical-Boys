# magnetism_1 stage 規格

由 `tools/voice/lesson_studio/build_lesson.py` 從稿子自動產生，請改稿子或腳本，不要手改 `stage.json`。

- `page`：課程頁 `magnetism_1.html`。
- `cuts`：播到 `＊切頁：<標題>` 時，點 `.tab-button[data-tab=tab]`，再點 `.sub-tab-btn[data-sub=sub]`。標題必須與稿子完全一致（共 5 個）。
- `at`：播到第 N 句（說話行編號，兩位數，與 manifest 的 `id` 相同）時，切到指定 tab／sub（共 33 個）。
- `subs`：該句的字幕顯示字。只放字幕和念的字不同的句子：N 極／S 極（恩極→N 極、艾斯極→S 極）與國字數字轉阿拉伯數字（五十牛頓→50 牛頓），其餘字不變；`pins` 是釘選黃條同樣的轉換（共 8 句）。沒列在 `subs` 的句子，字幕直接顯示 `text`。

句號有兩種寫法，不要混用：`id`／`stage.json` 的 key 是兩位數（01–106）；音檔檔名是三位數（`001_yanjun.mp3`–`106_...`），說話者對應 彥君=yanjun、曉臻=xiaozhen、合聲=hesheng。

## cuts

- 水和糖，同一條路嗎？（木質部與韌皮部） → `ps-0` / `None`
- 在上面還是在裡面？（葉與莖的剖面） → `ps-1` / `None`
- 排成一圈，還是散開？（真實莖切片） → `ps-2` / `None`
- 一年多一圈？（形成層與年輪） → `ps-3` / `None`
- 中空能活，剝皮卻危險？（樹皮與運輸） → `ps-4` / `None`

## at

- 第 01 句 → `ps-0` / `None`
- 第 07 句 → `ps-0` / `None`
- 第 09 句 → `ps-0` / `None`
- 第 15 句 → `ps-0` / `None`
- 第 16 句 → `ps-0` / `None`
- 第 19 句 → `ps-0` / `None`
- 第 21 句 → `ps-0` / `None`
- 第 31 句 → `ps-1` / `None`
- 第 32 句 → `ps-1` / `None`
- 第 34 句 → `ps-1` / `None`
- 第 36 句 → `ps-1` / `None`
- 第 37 句 → `ps-1` / `None`
- 第 45 句 → `ps-2` / `None`
- 第 48 句 → `ps-2` / `None`
- 第 49 句 → `ps-2` / `None`
- 第 50 句 → `ps-2` / `None`
- 第 52 句 → `ps-2` / `None`
- 第 54 句 → `ps-2` / `None`
- 第 55 句 → `ps-2` / `None`
- 第 63 句 → `ps-3` / `None`
- 第 65 句 → `ps-3` / `None`
- 第 68 句 → `ps-3` / `None`
- 第 70 句 → `ps-3` / `None`
- 第 72 句 → `ps-3` / `None`
- 第 74 句 → `ps-3` / `None`
- 第 77 句 → `ps-3` / `None`
- 第 78 句 → `ps-3` / `None`
- 第 80 句 → `ps-3` / `None`
- 第 85 句 → `ps-4` / `None`
- 第 89 句 → `ps-4` / `None`
- 第 96 句 → `ps-4` / `None`
- 第 102 句 → `ps-4` / `None`
- 第 104 句 → `ps-4` / `None`
