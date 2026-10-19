# 恆定與體溫：AI 教學插圖紀錄（2026-10-18）

- 生成工具：Google Gemini（老師生成並提供，2026-10-18）。性質：AI 教學插圖，非實拍。
- 提示詞為 Claude 提供給老師的完整版本（老師若有修改，以老師紀錄為準）。

| 本機檔名 | 用途 | 提示詞重點 | 處理 |
|---|---|---|---|
| body_digestive.png | 系統合作：消化 | Full human body semi-transparent mannequin … digestive system: esophagus, stomach, liver, small and large intestine | 去白底（原尺寸，供局部放大） |
| body_respiratory.png | 系統合作：呼吸 | … respiratory system: nasal cavity, trachea, bronchi and the two lungs | 去白底、縮圖 |
| body_urinary.png | 系統合作：泌尿 | … urinary system: two kidneys, two ureters and the urinary bladder | 去白底、縮圖 |
| skin_section.png | 系統合作（皮膚）、炎熱散熱、寒冷減少散熱 | Block of human skin in cross-section: epidermis, dermis with coiled sweat gland and duct, hair follicle, blood vessels, fat layer; no sweat droplets | 以飽和度去除灰色漸層背景；汗滴、水分子、血流光暈由程式疊加 |
| skin_vessels_wide.png / skin_vessels_narrow.png | 炎熱：血管擴張／寒冷：血管收縮 | 由 skin_section.png 衍生，不另生成 | 以程式偵測紅藍血管像素：擴張版加粗、加深紅色並讓真皮略泛紅；收縮版先以周圍膚色補平血管，再以淡色細線畫回。構圖與 skin_section.png 完全相同，只有血管不同。 |
| polar_bear.jpg / seal_ice.jpg | 內溫動物 | Polar bear on sea ice / seal on an ice floe, natural habitat | 保留背景、縮圖 |
| skink_basking.jpg / turtle_basking.jpg | 外溫動物 | Skink on a sunlit rock / turtle basking on a log | 保留背景、縮圖 |

- 發抖的手臂沿用 ../brain_reflex_ai_1018/arm_upper.png、arm_forearm.png。
- 「全身一起幫忙」：器官由全身圖局部放大（原圖裁切放大，邊緣淡出），標籤與物質流動由程式疊加。
- 炎熱／寒冷的「放大：皮膚血管」：小皮膚圖框出一條血管並在擴張版與收縮版之間淡入；放大區以程式繪製血管管徑連續變化、紅血球（固定亂數位置、互不重疊，數量與流速隨管徑增減）與散熱波。
- 體溫概念曲線、熱、汗、水分子、血流、溫度計與系統合作圖為程式繪製示意，不是實測資料。
- 封面維持原圖 assets/covers/biology_temperature_1009_v1.jpg。
