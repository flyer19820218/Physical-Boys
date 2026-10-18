# 腦與反射：AI 教學插圖紀錄（2026-10-18）

- 生成工具：Google Gemini（老師生成並提供原圖，2026-10-18）。
- 性質：AI 教學插圖，非實拍；頁面標示「AI 教學插圖」。
- 提示詞：老師依下列提示詞生成（如老師有自行修改，以老師紀錄為準）。

| 本機檔名 | 用途 | 提示詞 | 處理方式 |
|---|---|---|---|
| eye_dim.png / eye_bright.png | 瞳孔對光反射（較暗／較亮） | Close-up realistic illustration of a human brown eye, front view, in dim light with a large dilated pupil（較亮版改為 in bright light with a small constricted pupil）. Detailed iris texture. No text. Plain solid white background. | 去白底（邊緣漸層）、縮為 1000×746。頁面以較亮圖為底，Canvas 依模型半徑疊上瞳孔，接近全開時淡入較暗圖。 |
| reflex_hammer.png | 膝跳反射：叩診槌 | Medical reflex hammer with a triangular orange rubber head and a silver metal handle, side view, realistic product illustration. No text. Plain solid white background. | 去白底、去除底部陰影、裁切。 |
| leg_thigh.png / leg_lower.png | 膝跳反射：坐姿腿部 | Medical illustration of a human leg, side view facing right, person seated on the edge of a high table, shown from the waist down … No text, no labels, no arrows, no hammer. Plain solid white background. | 去白底；移除原圖白色桌子（改由 Canvas 繪製）；軀幹上緣淡出；沿膝關節切成大腿層與小腿層，小腿以膝關節為軸由 Canvas 旋轉。 |
| vertebra_section.png | 脊椎骨與脊髓橫切面 | Medical illustration of a human vertebra cross-section seen from above, showing the spinal cord inside the vertebral canal with the butterfly-shaped gray matter, and spinal nerves exiting on both sides … No text, no labels. Plain solid white background. | **科學修正：原圖脊髓上下顛倒**（深的前正中裂朝向棘突、細長的後角朝向椎體）。已將脊髓橢圓區域上下翻轉，使前正中裂朝向椎體；骨骼與神經未改。之後去白底。 |
| brain_sagittal.png | 腦的正中剖面（大腦、小腦、腦幹） | Medical illustration of a human brain, mid-sagittal section, side view facing left … No text, no labels, no arrows. Plain solid white background. | 去白底。點選構造時，以手描多邊形把其他區域壓暗（大腦／小腦／腦幹）。也用於中樞放大、縮手反射與瞳孔反射的小腦圖。 |
| nervous_system_body.png | 全身神經系統（中樞與周圍神經） | Medical illustration of the human nervous system, full body front view … No text, no labels. Plain solid white background. | 去白底。「腦與脊髓」時壓暗腦與脊髓以外的部分；周圍神經的訊息光點與脊椎骨塊由 Canvas 疊加。 |
| hot_pot.png | 縮手反射：瓦斯爐上的燙鍋 | Realistic illustration of a stainless steel cooking pot with a lid on a small portable gas stove, blue and orange flames under the pot, a little steam rising from the lid, side view. No hands, no people, no text. Plain solid white background. | 去灰白底、去除地面陰影、裁切；Canvas 另加火光閃爍與蒸氣動畫。 |
| arm_upper.png / arm_forearm.png | 縮手反射：手臂 | Medical illustration of a human right arm, side view, from the shoulder to the fingertips … The skin is semi-transparent like an X-ray illustration, showing the biceps muscle … No body, no torso, no text, no labels, no arrows. Plain solid white background. | 去白底、肩膀右緣淡出；沿手肘切成上臂層與前臂層，縮手時前臂以手肘為軸由 Canvas 旋轉。原圖手肘處有幾顆白色圓球（畫風），不影響教學，未修改。 |

處理程式：去背以「與邊框相連的近白區域」為背景，依亮度轉為透明度並去除白邊；原圖保留於老師端。
