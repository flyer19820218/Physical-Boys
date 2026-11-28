# 手部姿勢庫 v1（2026-11-28）

用 Blender（bpy）程式化建模、擺姿勢、離線渲染成**透明底 PNG**的卡通手。給動畫與動手做畫面貼圖用（推、拉、握、捏、托、下壓）。

> **已是正式規範（老師 2026-11-28）：以後動畫與動手做裡的手，一律用這套姿勢庫**（`AGENTS.md` 3.2「手的畫法」，取代舊的「不畫手」）。目前還沒有任何一課實際貼上；新做、重製的課開始使用，舊課不主動改（改舊動畫仍需老師授權）。

## 內容
- 10 個姿勢 × 4 個視角 = 40 張 800×800 透明底 PNG：`<姿勢>_<視角>.png`
- 姿勢：`open`（張開）、`fist`（握拳）、`point`（食指指出）、`grip`（握圓柱，直徑 6 cm）、`pinch`（捏）、`push`（掌心推）、`push_fingertip`（指尖推）、`hook`（鉤住，拉彈簧秤）、`hold_flat`（手掌托物）、`press_down`（平手下壓）
- 視角：`side`（側視，手指朝右、手背朝上）、`top`（俯視）、`three`（斜 45°）、`palm`（掌心面）
- `anchors.json`：每個姿勢、每個視角的接觸點與施力方向（見下）
- `grip_three_1600.png`：1600 px 正式尺寸示範
- `_樣張_*.png`：全部姿勢的拼接樣張（紅點＝接觸點、藍箭頭＝施力方向，只是標記，正式 PNG 是乾淨的）

所有圖**同一比例尺**（畫面寬 30 cm，約 26.67 px／cm），**掌心中心固定在圖片正中央**，換姿勢、換視角時手不會跳位。

## 接觸點（anchors.json）怎麼用
結構：`d[姿勢].anchors[錨點名].views[視角]` 內有 `px`（圖片像素，原點左上）、`cm`、`force_px`（該視角下施力方向的單位向量；`null` 表示力沿視線方向）。

把手貼到畫布上，讓錨點落在物體的接觸點 `(tx, ty)`：

```js
// 範例：側視的「推」，掌心中心對到木箱左側面中點，方向取自 force_px
function drawHand(ctx, img, anchors, pose, view, name, tx, ty, scale) {
  const a = anchors[pose].anchors[name].views[view];
  ctx.drawImage(img, tx - a.px[0] * scale, ty - a.px[1] * scale,
                img.width * scale, img.height * scale);
  return a.force_px;   // 畫力的箭頭時用
}
```
`scale` ＝（畫布上 1 cm 的像素數）÷ 26.67。圖大部分是透明邊，貼圖前不必裁切（錨點是依整張圖算的）。

## 已知瑕疵（交件時的實話）
- `pinch`：只有 top、three 看得懂，side 只看到手背。
- `hook`：斜視的鉤形不明顯，side 最清楚。
- `push`：手是直立的，top、palm 視角沒有實用價值，請用 side 或 three。
- `fist`：從手背上方看，指根連成一塊肉；側視時拇指下緣多一小塊。
- 整體偏「寫實的胖」；要更 Q 可加粗、縮短手指（`tools/hands/build_hand_v2.py`）。
- **膚色尚未定案**，現為暖橘色；之後只改 `build_hand_v2.py` 開頭的 `SKIN_HEX` 一個參數，重跑即可。

## 重新渲染／新增姿勢
```bash
pip install --break-system-packages bpy     # Blender 5.x 的 Python 模組（約 430 MB）；只用 Cycles CPU，不需要 GPU
cd tools/hands
python3 render_all.py --poses fist,grip --size 800 --out out
```
新增姿勢：在 `tools/hands/poses_v2.py` 的 `POSES` 加一筆（各指關節角度、擺放方向、錨點），再執行 `python3 render_all.py --poses <新姿勢>`。每個姿勢建模約 35 秒，每張 800 px 約 10 秒。
