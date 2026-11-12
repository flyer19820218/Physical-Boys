# magnetism_1 stage 規格

由 `tools/voice/lesson_studio/build_lesson.py` 從稿子自動產生，請改稿子或腳本，不要手改 `stage.json`。

- `page`：課程頁 `magnetism_1.html`。
- `cuts`：播到 `＊切頁：<標題>` 時，點 `.tab-button[data-tab=tab]`，再點 `.sub-tab-btn[data-sub=sub]`。標題必須與稿子完全一致（共 5 個）。
- `at`：播到第 N 句（說話行編號，兩位數，與 manifest 的 `id` 相同）時，切到指定 tab／sub（共 23 個）。
- `subs`：該句的字幕顯示字。只放字幕和念的字不同的句子：N 極／S 極（恩極→N 極、艾斯極→S 極）與國字數字轉阿拉伯數字（五十牛頓→50 牛頓），其餘字不變；`pins` 是釘選黃條同樣的轉換（共 20 句）。沒列在 `subs` 的句子，字幕直接顯示 `text`。

句號有兩種寫法，不要混用：`id`／`stage.json` 的 key 是兩位數（01–106）；音檔檔名是三位數（`001_yanjun.mp3`–`106_...`），說話者對應 彥君=yanjun、曉臻=xiaozhen、合聲=hesheng。

## cuts

- 保麗龍為什麼不會被沖上岸？ → `intro` / `None`
- 橫波的高低起伏，名詞怎麼認？ → `transverse` / `None`
- 講話又沒吹風，聲音怎麼傳過去的？ → `longitudinal` / `None`
- 看到閃電，為什麼過幾秒才聽到雷聲？ → `propagation` / `None`
- 只要知道波往哪走，就能猜出介質下一秒？ → `example` / `None`

## at

- 第 01 句 → `intro` / `None`
- 第 10 句 → `intro` / `None`
- 第 15 句 → `intro` / `None`
- 第 21 句 → `intro` / `None`
- 第 24 句 → `intro` / `None`
- 第 29 句 → `transverse` / `None`
- 第 31 句 → `transverse` / `None`
- 第 33 句 → `transverse` / `None`
- 第 34 句 → `transverse` / `None`
- 第 37 句 → `transverse` / `None`
- 第 43 句 → `longitudinal` / `None`
- 第 45 句 → `longitudinal` / `None`
- 第 47 句 → `longitudinal` / `None`
- 第 54 句 → `propagation` / `None`
- 第 56 句 → `propagation` / `None`
- 第 58 句 → `propagation` / `None`
- 第 59 句 → `propagation` / `None`
- 第 61 句 → `propagation` / `None`
- 第 62 句 → `propagation` / `None`
- 第 70 句 → `example` / `None`
- 第 73 句 → `example` / `None`
- 第 78 句 → `example` / `None`
- 第 81 句 → `example` / `None`
