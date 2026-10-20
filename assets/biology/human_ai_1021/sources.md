# 人類遺傳：AI 教學插圖紀錄（2026-10-21）

- 生成工具：Google Gemini（老師生成並提供，2026-10-21）。性質：AI 教學插圖，非實拍。
- 完整提示詞：`../genetics_ai_prompts_1020.md` 的 H1～H5。提示詞都是從科學內容重新描述，沒有把課本圖交給 Gemini 參考。
- 原始 JPEG 備份：`local-backups/20261021/human_ai_originals/`（同資料夾有去背程式 `cut_human_ai_1021.py`）。
- 這一課原本借用的課本眼睛照片（`../genetics_originals_1010_v1/Im18_119.png`、`Im20_121.png`）不再使用，檔案沒有刪除。

| 本機檔名 | 用途 | 提示詞 | 處理 |
|---|---|---|---|
| eyes_double.png、eyes_single.png | 人類的遺傳性狀：眼皮（雙眼皮／單眼皮） | H2：上下兩排眼睛，上排雙眼皮、下排單眼皮 | 去白底，上下切開，只留一隻眼睛與眉毛（切口以橢圓漸層淡出），縮為 0.5 |
| ear_free.png、ear_attached.png | 人類的遺傳性狀：耳垂（分離／緊貼） | H1：兩隻耳朵，左邊耳垂分離、右邊耳垂緊貼 | 去白底，左右切開，縮為 0.5 |
| dimples_yes.png、dimples_no.png | 人類的遺傳性狀：酒窩（有／無） | H3：兩張微笑的下半臉，左邊有酒窩 | 去白底，左右切開，縮為 0.5 |
| tongue_roll.png、tongue_flat.png | 人類的遺傳性狀：捲舌（能／不能） | H4：兩張張開的嘴，左邊舌頭捲成 U 形 | 去白底，左右切開，縮為 0.5 |
| hairline_peak.png、hairline_straight.png | 人類的遺傳性狀：美人尖（有／無） | H5：兩個額頭，左邊有美人尖 | 去白底，左右切開，縮為 0.5 |

- 去背方法：這批圖的臉部邊緣是「漸層淡出到白色」。淡出的像素看成「皮膚色和白色混合」：皮膚用彩度、黑髮用暗度估計不透明度，只處理與畫面外框相連、而且離純白背景 70 px 以內的區域（牙齒、眼白、臉上的亮部不會被挖空），再把白色從顏色中扣除，在黑板底色上不會出現白邊。
- 顯性／隱性、A 與 a、配子、孩子的組合、ABO 血型的棋盤格、抽棋子的統計圖、染色體圖譜與性別決定都是本站以程式繪製的示意。染色體長度依人類染色體的真實大小（百萬鹼基對）等比例縮小，條紋為示意。
- 「補充：不一定那麼簡單」的依據：John H. McDonald, *Myths of Human Genetics*（University of Delaware）：捲舌 <https://udel.edu/~mcdonald/mythtongueroll.html>、耳垂 <https://udel.edu/~mcdonald/mythearlobe.html>、酒窩 <https://udel.edu/~mcdonald/mythdimples.html>、美人尖 <https://udel.edu/~mcdonald/mythwidowspeak.html>。
