# 呼吸與氣體：AI 教學插圖紀錄（2026-10-19）

- 生成工具：Google Gemini（老師生成並提供，2026-10-19）。性質：AI 教學插圖，非實拍。
- 提示詞為 Claude 提供給老師的完整版本（老師若有修改，以老師紀錄為準）。
- 去背方式：以「彩度」判斷背景（白底與灰色陰影都屬低彩度），從畫面邊緣連通的區域才去除；被主體包住的白色縫隙（肺泡血管網、蚱蜢腳間）另外去除。軀幹圖（呼吸道、胸腔）底邊被畫面截斷，只從上、左、右三邊判斷背景，並平滑邊緣避免 JPEG 方塊雜點。

| 本機檔名 | 用途 | 提示詞重點 | 處理 |
|---|---|---|---|
| airway_section.png | 空氣走哪條路？ | Head, neck and chest side-view cross-section facing left: nasal cavity, pharynx, larynx, trachea dividing into bronchi entering the lungs | 去白底、縮圖；器官局部放大與氣流由程式疊加 |
| alveoli_capillaries.png | 進血液，出肺泡 | Cluster of alveoli at the end of a bronchiole, red and blue capillary network, one alveolus cut open to show it is hollow | 去白底與血管間白縫 |
| chest_diaphragm.png | 誰把胸腔撐開？ | Chest front view: rib cage, two lungs, dome-shaped diaphragm | 去白底；橫膈升降與肋骨動作以程式示意 |
| fish_gills.png | 不用肺，也能交換：魚 | Freshwater fish side view, gill cover lifted to show red feathery gills | 去白底與下方灰色陰影 |
| grasshopper_tracheae.png | 不用肺，也能交換：昆蟲 | Grasshopper side view, semi-transparent body with silvery tracheal tubes and spiracles | 去白底與腳間白縫 |
| salamander_stream.jpg | 不用肺，也能交換：兩生類皮膚 | Salamander with moist shiny skin on wet moss beside a mountain stream | 保留自然背景、縮圖 |
| leaf_stomata.png | 不用肺，也能交換：葉片氣孔 | Lower leaf surface under a light microscope: puzzle-shaped epidermal cells, stomata with two guard cells | 以圓形遮罩裁成顯微視野（教學示意，非實際顯微照片） |
| lenticel_branch.png | 不用肺，也能交換：皮孔 | Young cherry branch with raised horizontal lenticels | 去白底 |
| mung_beans.png | 透明怎麼變混濁？ | Dry mung beans vs germinating mung beans on moist cotton in two glass dishes | 去白底（保留玻璃皿內部） |

- 石灰水、瓶中氣球模型、氣體分子、細胞呼吸作用與血流為程式繪製示意。
- 封面維持原圖。
