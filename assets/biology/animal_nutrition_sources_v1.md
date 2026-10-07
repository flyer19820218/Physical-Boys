# 3-4 動物的營養方式｜V1 圖像、版權與科學紀錄

2026-10-07，本機預覽，尚未授權公開發布。正式候選 `biology_animal_nutrition.html`，獨立預覽 `biology_animal_nutrition_preview_1007_v1.html`。不重製老師課本圖片或手寫註記，也不改用鏡像圖片冒稱 AI 原創。

## 已使用的圖像

| 本機檔案 | 原作品／作者／授權 | 使用與修改 |
| --- | --- | --- |
| `animal_digestive_original_v1.svg`；同名 PNG | [Digestive system without labels.svg](https://commons.wikimedia.org/wiki/File:Digestive_system_without_labels.svg)，Mariana Ruiz (LadyofHats)、Jmarchn；原作者釋出公共領域，來源頁載明允許任何用途。原檔：[下載](https://upload.wikimedia.org/wikipedia/commons/e/ed/Digestive_system_without_labels.svg)。 | 原 SVG 完整保留；Native Canvas 等比轉為 1053×2463 PNG，構造、顏色與原始座標不重畫。顯示層局部放大、點選標記與雙語外部說明；不宣稱實拍。 |
| `animal_intestine_openstax_v1.jpg` | [2418 Histology Small IntestinesN.jpg](https://commons.wikimedia.org/wiki/File:2418_Histology_Small_IntestinesN.jpg)，OpenStax College；[CC BY 3.0](https://creativecommons.org/licenses/by/3.0/)。原檔：[下載](https://upload.wikimedia.org/wikipedia/commons/c/c1/2418_Histology_Small_IntestinesN.jpg)。 | 1079×824 原 JPG 不改檔。光學模式僅顯示原圖 b/c 的局部視野，等比呈現，不去除比例尺或捏造細節；吸收模式顯示原圖的絨毛局部並疊上分子教學符號。完整原圖亦可查看，保留原英文字；中文解說在介面與圖下。來源圖 a 是示意、b/c 是染色光學切片、d 是電子顯微圖，不能混稱實拍或自然色。 |
| `../covers/biology_animal_nutrition_cover_v1.png` | 本專案原創 imagegen 圖，非真實野生動物照片、非第三方重製。 | 1536×1024 無字封面，緩慢推鏡與暗角由 CSS 顯示層提供。原始生成檔保留。 |

素材 SHA-256 及原生測試紀錄見 `animal_nutrition_checks_v1.md`；來源 HTML 保存在本機備份，來源與授權連結也在頁面逐張提供。公共領域／CC 圖像與整站程式授權分開。

### 封面完整提示詞

Original cinematic no-text biology lesson cover, landscape 3:2. A close, lifelike eastern chipmunk seated on moss, delicately holding and eating a walnut seed with its forepaws. Fine individual warm-brown fur, anatomically realistic paws, tiny whiskers, bright alert eyes. Foreground seed shell textures, soft forest light, deep emerald bokeh, dramatic yet natural shallow depth of field, elegant premium wildlife documentary still, rich restrained color, realistic photographic visual style. Leave the left one third mostly softly defocused forest for quiet composition, not for text. NO anatomy overlay, no schematic, no cartoon, no icons, absolutely no text, no letters, no numbers, no labels, no logos, no watermark. This will be disclosed as an AI illustration, not a real wildlife photograph.

生成來源：`/Users/lvyanjun/.codex/generated_images/01a04ddb-6e28-7263-a57d-c8cd7f95992c/exec-c9a3a60d-e10d-40cc-8ad5-83e008282e51.png`。人工檢視無字、有自然的攝食姿勢，僅用於情境封面，不作解剖構造證據。

## 教學內容對照

老師的 `702.pdf` 第 20–26 頁（課本印刷 73–79 頁）提供主要內容；第 29 頁（印刷 82 頁）供草食動物補充。不公開上傳 PDF、截圖或字跡。

- 攝食／消化／吸收、物理與化學消化：課本 73–75、78–79 頁；輔助核對 [OpenStax Biology §34.3](https://openstax.org/books/biology/pages/34-3-digestive-system-processes)。
- 消化道順序、腺體、蠕動與胃：課本 74–75 頁；核對 [消化系統概覽](https://openstax.org/books/anatomy-and-physiology-2e/pages/23-1-overview-of-the-digestive-system)。
- 肝臟製造膽汁／膽囊儲存、乳化無酵素、胰液作用於小腸：課本 76 頁；核對 [肝、胰、膽囊](https://openstax.org/books/anatomy-and-physiology-2e/pages/23-6-accessory-organs-in-digestion-the-liver-pancreas-and-gallbladder)。
- 小腸主要吸收場所、皺褶／絨毛／微血管／乳糜管：課本 77–79 頁；核對 [小腸與大腸](https://openstax.org/books/anatomy-and-physiology-2e/pages/23-5-the-small-and-large-intestines)。脂質淋巴路線只作補充，核對 [化學消化與吸收](https://openstax.org/books/anatomy-and-physiology-2e/pages/23-7-chemical-digestion-and-absorption-a-closer-look)。
- 脂質產物主畫面依國中課本以甘油、脂肪酸表達，文字補充實際也有單酸甘油酯；不把多數長鏈脂質畫成直接進入微血管。
- 腸液主要整理為醣類、蛋白質消化，部分酵素位於刷狀緣；表格明確是本課重點，不把總結當成酵素的完整生理分類。

## 教學模型界線

分子形狀、數量、位置與速率為示意，非原子比例或真實測量；不使用氣體箭頭或化學鍵來干擾本單元重點。蠕動畫出食團後方收縮、前方放鬆；可暫停、拖曳進度。膽汁乳化不產生甘油／脂肪酸，消化酵素則依選定養分與液體顯示片段或產物。吸收模型僅示範葡萄糖、胺基酸、水與完整大分子之差別；脂質運輸使用文字補充，不偷換成血管路徑。

未採用的研究候選 NIH BioArt 與 Snow93 檔案留在本機，沒有在本單元介面引用；不因試圖找圖而刪協作目錄中的檔案。這些候選不納入未來發布素材清單。
