# magnetism_1 stage 規格

由 `tools/voice/lesson_studio/build_lesson.py` 從稿子自動產生，請改稿子或腳本，不要手改 `stage.json`。

- `page`：課程頁 `magnetism_1.html`。
- `cuts`：播到 `＊切頁：<標題>` 時，點 `.tab-button[data-tab=tab]`，再點 `.sub-tab-btn[data-sub=sub]`。標題必須與稿子完全一致（共 6 個）。
- `at`：播到第 N 句（說話行編號，兩位數，與 manifest 的 `id` 相同）時，切到指定 tab／sub（共 25 個）。
- `subs`：該句的字幕顯示字。只放字幕和念的字不同的句子：N 極／S 極（恩極→N 極、艾斯極→S 極）與國字數字轉阿拉伯數字（五十牛頓→50 牛頓），其餘字不變；`pins` 是釘選黃條同樣的轉換（共 18 句）。沒列在 `subs` 的句子，字幕直接顯示 `text`。

句號有兩種寫法，不要混用：`id`／`stage.json` 的 key 是兩位數（01–106）；音檔檔名是三位數（`001_yanjun.mp3`–`106_...`），說話者對應 彥君=yanjun、曉臻=xiaozhen、合聲=hesheng。

## cuts

- 為什麼車子會轉彎？（車輪入爛泥巴） → `car_mud` / `car_mud`
- 大角快、小角慢（無敵口訣） → `snells_law` / `snells_law`
- 光出不去了（全反射與臨界角） → `total_internal_reflection` / `total_internal_reflection`
- 沙漠有水、海上有船（蜃景） → `mirage` / `mirage`
- 硬幣浮起來（加水看硬幣） → `coin_water` / `coin_water`
- 魚看人、人看魚（水底看人） → `fish_human` / `fish_human`

## at

- 第 01 句 → `car_mud` / `car_mud`
- 第 07 句 → `car_mud` / `car_mud`
- 第 11 句 → `car_mud` / `car_mud`
- 第 17 句 → `car_mud` / `car_mud`
- 第 21 句 → `snells_law` / `snells_law`
- 第 26 句 → `snells_law` / `snells_law`
- 第 29 句 → `snells_law` / `snells_law`
- 第 33 句 → `snells_law` / `snells_law`
- 第 41 句 → `snells_law` / `snells_law`
- 第 43 句 → `snells_law` / `snells_law`
- 第 44 句 → `snells_law` / `snells_law`
- 第 46 句 → `total_internal_reflection` / `total_internal_reflection`
- 第 50 句 → `total_internal_reflection` / `total_internal_reflection`
- 第 53 句 → `total_internal_reflection` / `total_internal_reflection`
- 第 55 句 → `total_internal_reflection` / `total_internal_reflection`
- 第 64 句 → `total_internal_reflection` / `total_internal_reflection`
- 第 66 句 → `total_internal_reflection` / `total_internal_reflection`
- 第 68 句 → `mirage` / `mirage`
- 第 75 句 → `mirage` / `mirage`
- 第 81 句 → `coin_water` / `coin_water`
- 第 83 句 → `coin_water` / `coin_water`
- 第 86 句 → `coin_water` / `coin_water`
- 第 91 句 → `coin_water` / `coin_water`
- 第 93 句 → `fish_human` / `fish_human`
- 第 99 句 → `fish_human` / `fish_human`
