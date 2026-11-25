# magnetism_1 stage 規格

由 `tools/voice/lesson_studio/build_lesson.py` 從稿子自動產生，請改稿子或腳本，不要手改 `stage.json`。

- `page`：課程頁 `magnetism_1.html`。
- `cuts`：播到 `＊切頁：<標題>` 時，點 `.tab-button[data-tab=tab]`，再點 `.sub-tab-btn[data-sub=sub]`。標題必須與稿子完全一致（共 5 個）。
- `at`：播到第 N 句（說話行編號，兩位數，與 manifest 的 `id` 相同）時，切到指定 tab／sub（共 51 個）。
- `subs`：該句的字幕顯示字。只放字幕和念的字不同的句子：N 極／S 極（恩極→N 極、艾斯極→S 極）與國字數字轉阿拉伯數字（五十牛頓→50 牛頓），其餘字不變；`pins` 是釘選黃條同樣的轉換（共 58 句）。沒列在 `subs` 的句子，字幕直接顯示 `text`。

句號有兩種寫法，不要混用：`id`／`stage.json` 的 key 是兩位數（01–106）；音檔檔名是三位數（`001_yanjun.mp3`–`106_...`），說話者對應 彥君=yanjun、曉臻=xiaozhen、合聲=hesheng。

## cuts

- 看不見的力，怎麼抓到它？ → `tab1` / `effects`
- 飛到月球，你會變輕還是變瘦？ → `tab2` / `mass`
- 彈簧真的可以無限拉長嗎？ → `tab3` / `hooke`
- 兩條彈簧接成一條會怎樣？ → `tab4` / `tension`
- 並排一起拉，力量分工還是加倍？ → `tab5` / `parallel`

## at

- 第 01 句 → `tab1` / `effects`
- 第 09 句 → `tab1` / `effects`
- 第 11 句 → `tab1` / `effects`
- 第 13 句 → `tab1` / `effects`
- 第 14 句 → `tab1` / `effects`
- 第 16 句 → `tab1` / `ftypes`
- 第 17 句 → `tab1` / `ftypes`
- 第 18 句 → `tab1` / `ftypes`
- 第 20 句 → `tab1` / `ftypes`
- 第 21 句 → `tab1` / `ftypes`
- 第 24 句 → `tab1` / `ftypes`
- 第 34 句 → `tab2` / `mass`
- 第 35 句 → `tab2` / `mass`
- 第 37 句 → `tab2` / `mass`
- 第 39 句 → `tab2` / `mass`
- 第 41 句 → `tab2` / `weight`
- 第 42 句 → `tab2` / `weight`
- 第 44 句 → `tab2` / `weight`
- 第 45 句 → `tab2` / `weight`
- 第 47 句 → `tab2` / `weight`
- 第 50 句 → `tab2` / `weight`
- 第 58 句 → `tab3` / `hooke`
- 第 59 句 → `tab3` / `hooke`
- 第 60 句 → `tab3` / `hooke`
- 第 62 句 → `tab3` / `hooke`
- 第 65 句 → `tab3` / `limit`
- 第 66 句 → `tab3` / `limit`
- 第 67 句 → `tab3` / `limit`
- 第 69 句 → `tab3` / `limit`
- 第 71 句 → `tab3` / `limit`
- 第 72 句 → `tab3` / `graph`
- 第 74 句 → `tab3` / `graph`
- 第 75 句 → `tab3` / `graph`
- 第 76 句 → `tab3` / `graph`
- 第 77 句 → `tab3` / `graph`
- 第 79 句 → `tab3` / `graph`
- 第 86 句 → `tab4` / `tension`
- 第 87 句 → `tab4` / `tension`
- 第 89 句 → `tab4` / `tension`
- 第 90 句 → `tab4` / `tension`
- 第 91 句 → `tab4` / `series`
- 第 92 句 → `tab4` / `series`
- 第 93 句 → `tab4` / `series`
- 第 94 句 → `tab4` / `series`
- 第 96 句 → `tab4` / `series`
- 第 100 句 → `tab5` / `parallel`
- 第 101 句 → `tab5` / `parallel`
- 第 102 句 → `tab5` / `parallel`
- 第 104 句 → `tab5` / `parallel`
- 第 106 句 → `tab5` / `compare`
- 第 112 句 → `tab5` / `compare`
