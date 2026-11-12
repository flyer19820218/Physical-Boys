# magnetism_1 stage 規格

由 `tools/voice/lesson_studio/build_lesson.py` 從稿子自動產生，請改稿子或腳本，不要手改 `stage.json`。

- `page`：課程頁 `magnetism_1.html`。
- `cuts`：播到 `＊切頁：<標題>` 時，點 `.tab-button[data-tab=tab]`，再點 `.sub-tab-btn[data-sub=sub]`。標題必須與稿子完全一致（共 5 個）。
- `at`：播到第 N 句（說話行編號，兩位數，與 manifest 的 `id` 相同）時，切到指定 tab／sub（共 20 個）。
- `subs`：該句的字幕顯示字。只放字幕和念的字不同的句子：N 極／S 極（恩極→N 極、艾斯極→S 極）與國字數字轉阿拉伯數字（五十牛頓→50 牛頓），其餘字不變；`pins` 是釘選黃條同樣的轉換（共 7 句）。沒列在 `subs` 的句子，字幕直接顯示 `text`。

句號有兩種寫法，不要混用：`id`／`stage.json` 的 key 是兩位數（01–106）；音檔檔名是三位數（`001_yanjun.mp3`–`106_...`），說話者對應 彥君=yanjun、曉臻=xiaozhen、合聲=hesheng。

## cuts

- 想讓吉他更大聲，用力撥還是鎖緊？ → `tab1` / `None`
- 爸爸聲音低沉，嬰兒哭聲尖銳，為什麼？ → `tab2` / `None`
- 閉上眼睛，怎麼知道是鋼琴還是小提琴？ → `tab3` / `None`
- 敲水杯和吹水杯，哪個水越滿音越高？ → `tab4` / `None`
- 兩把吉他調得一樣，為什麼彈一把另一把也響？ → `tab5` / `None`

## at

- 第 05 句 → `tab1` / `None`
- 第 09 句 → `tab1` / `None`
- 第 12 句 → `tab1` / `None`
- 第 13 句 → `tab1` / `None`
- 第 17 句 → `tab1` / `None`
- 第 20 句 → `tab2` / `None`
- 第 25 句 → `tab2` / `None`
- 第 27 句 → `tab2` / `None`
- 第 29 句 → `tab2` / `None`
- 第 39 句 → `tab3` / `None`
- 第 44 句 → `tab3` / `None`
- 第 46 句 → `tab3` / `None`
- 第 50 句 → `tab3` / `None`
- 第 57 句 → `tab4` / `None`
- 第 62 句 → `tab4` / `None`
- 第 66 句 → `tab4` / `None`
- 第 70 句 → `tab4` / `None`
- 第 73 句 → `tab5` / `None`
- 第 77 句 → `tab5` / `None`
- 第 80 句 → `tab5` / `None`
