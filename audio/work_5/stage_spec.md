# magnetism_1 stage 規格

由 `tools/voice/lesson_studio/build_lesson.py` 從稿子自動產生，請改稿子或腳本，不要手改 `stage.json`。

- `page`：課程頁 `magnetism_1.html`。
- `cuts`：播到 `＊切頁：<標題>` 時，點 `.tab-button[data-tab=tab]`，再點 `.sub-tab-btn[data-sub=sub]`。標題必須與稿子完全一致（共 14 個）。
- `at`：播到第 N 句（說話行編號，兩位數，與 manifest 的 `id` 相同）時，切到指定 tab／sub（共 44 個）。
- `subs`：該句的字幕顯示字。只放字幕和念的字不同的句子：N 極／S 極（恩極→N 極、艾斯極→S 極）與國字數字轉阿拉伯數字（五十牛頓→50 牛頓），其餘字不變；`pins` 是釘選黃條同樣的轉換（共 23 句）。沒列在 `subs` 的句子，字幕直接顯示 `text`。

句號有兩種寫法，不要混用：`id`／`stage.json` 的 key 是兩位數（01–106）；音檔檔名是三位數（`001_yanjun.mp3`–`106_...`），說話者對應 彥君=yanjun、曉臻=xiaozhen、合聲=hesheng。

## cuts

- 電動機車的電從哪來？ → `tab1` / `classify`
- 火力發電：燒的是什麼？怎麼變成電？ → `tab1` / `thermal`
- 一顆中子的骨牌 → `tab2` / `fission`
- 核電廠：從熱到電 → `tab2` / `plant`
- 太陽沒有在燃燒 → `tab3` / `sun`
- 分裂與融合比一比 → `tab3` / `compare`
- 未來的新星：人造太陽 → `tab3` / `future`
- 水風光生質地熱各有絕招 → `tab4` / `hydrowind`
- 陽光，可以變成熱也能變成電 → `tab4` / `solar`
- 植物裡儲存的能量，可以拿來發電 → `tab4` / `biomass`
- 地底、海流與潮汐，也藏著電 → `tab4` / `geo`
- 沒有十全十美的能源 → `tab5` / `mix`
- 台灣與新興能源 → `tab5` / `newtech`
- 每種能源都有得，也有失 → `tab5` / `tradeoff`

## at

- 第 01 句 → `tab1` / `classify`
- 第 06 句 → `tab1` / `classify`
- 第 10 句 → `tab1` / `classify`
- 第 13 句 → `tab1` / `classify`
- 第 16 句 → `tab1` / `classify`
- 第 19 句 → `tab1` / `thermal`
- 第 20 句 → `tab1` / `thermal`
- 第 21 句 → `tab1` / `thermal`
- 第 23 句 → `tab1` / `thermal`
- 第 28 句 → `tab2` / `fission`
- 第 32 句 → `tab2` / `fission`
- 第 33 句 → `tab2` / `fission`
- 第 38 句 → `tab2` / `fission`
- 第 40 句 → `tab2` / `fission`
- 第 41 句 → `tab2` / `fission`
- 第 44 句 → `tab2` / `plant`
- 第 45 句 → `tab2` / `plant`
- 第 46 句 → `tab2` / `plant`
- 第 48 句 → `tab2` / `plant`
- 第 49 句 → `tab2` / `plant`
- 第 56 句 → `tab3` / `sun`
- 第 57 句 → `tab3` / `sun`
- 第 58 句 → `tab3` / `sun`
- 第 61 句 → `tab3` / `sun`
- 第 83 句 → `tab4` / `hydrowind`
- 第 84 句 → `tab4` / `hydrowind`
- 第 87 句 → `tab4` / `hydrowind`
- 第 88 句 → `tab4` / `hydrowind`
- 第 91 句 → `tab4` / `solar`
- 第 98 句 → `tab4` / `biomass`
- 第 99 句 → `tab4` / `biomass`
- 第 100 句 → `tab4` / `biomass`
- 第 102 句 → `tab4` / `geo`
- 第 103 句 → `tab4` / `geo`
- 第 104 句 → `tab4` / `geo`
- 第 105 句 → `tab4` / `geo`
- 第 109 句 → `tab5` / `mix`
- 第 110 句 → `tab5` / `mix`
- 第 111 句 → `tab5` / `mix`
- 第 117 句 → `tab5` / `newtech`
- 第 119 句 → `tab5` / `newtech`
- 第 120 句 → `tab5` / `newtech`
- 第 123 句 → `tab5` / `newtech`
- 第 126 句 → `tab5` / `newtech`
