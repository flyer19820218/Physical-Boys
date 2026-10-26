# 多胚珠子房重畫（OV5）：Gemini 插圖咒語（2026-10-27）

## 為什麼要重畫

- 舊圖 `ovary_multi.png`（OV2，2026-10-23 生）的胚珠本身畫得簡化：珠柄接在胚珠的**左端**、小尖（珠孔）卻在**右端**，花粉管只能繞過整顆胚珠才到珠孔，動畫看起來怪（老師 2026-10-27：「要跟著圖示，不要繞到另外一邊，胚孔在哪就去哪」）。
- 真實的倒生胚珠（豌豆等大多數被子植物）：胚珠在珠柄上向後彎，**珠孔就在珠柄接上胚珠的旁邊、朝向胎座**。單胚珠圖（OV4）已經是這樣，花粉管沿子房腔壁（胎座）→珠柄→珠孔，路很短。
- 新圖要讓 5 顆胚珠都像 OV4：珠孔清楚、朝向胎座、靠近珠柄。

## 怎麼用

- 整段（含最後的 Style）貼給 Gemini，生好貼回對話，告訴我「OV5」。白底，圖裡不能有字、箭頭、標籤、浮水印。
- 圖裡**不畫花粉管、精細胞、細胞核**（用程式畫）。
- 若 Gemini 不照 9:16，改成 16:9 也可以（舊圖就是 16:9 生的）。

## OV5　多胚珠子房縱切（珠孔朝向胎座）

```
A longitudinal cross-section of the ovary of a flowering plant that contains exactly FIVE ovules, shown large and centered on a plain white background, tall vertical composition (the style and ovary fill most of the picture height, like a tall narrow vase).

From top to bottom: a small broad stigma (pale yellow-green) at the very top center; directly below it a slim straight style (a narrow column) with one very thin, pale, hollow channel running down through its center; then the ovary, a tall oval chamber with a thick pale-green wall (the cut surface shows fine cell texture). The channel of the style opens into the top of the ovary's inner cavity.

The inner cavity is one large, clean chamber with a smooth pale cream inner surface. Running down the whole LEFT inner wall of the cavity, from the top of the cavity to the bottom, is a smooth, clearly visible thick ridge of pale tissue (the placenta) with an even, unbroken surface facing the cavity. Exactly five ovules are attached to this placenta by five short, thin stalks of equal length, each stalk leaving the placenta toward the right and curving slightly downward. The five ovules are stacked in one single vertical column, evenly spaced, all the same size, the same shape and the same orientation, with clear empty space between neighbouring ovules and between the ovules and the right wall of the cavity.

Every ovule is egg-shaped and bent back on its stalk (anatropous, like a hook): two thin outer layers (integuments, pale green and cream) wrapping an inner tissue, with one large, smooth, EMPTY pale-yellow oval cavity in its middle (the embryo sac: no cells, no nuclei, no dots). The small opening of each ovule (the micropyle) is a clearly visible little notch in the outer layers, and it points LEFT, back toward the placenta wall, right next to the place where the stalk joins the ovule, so the micropyle is only a short distance from the placenta. The rounded far end of every ovule points to the right, into the cavity. Draw exactly five ovules, none hidden, none overlapping.

Nothing else in the picture: no pollen grains, no pollen tubes, no sperm, no cell nuclei, no text, no numbers, no labels, no arrows, no leaves, no petals.

Style: soft botanical teaching illustration, watercolor and fine ink line, muted greens and creams, gentle shading, clear edges, flat white background, no shadow on the background, 9:16 portrait.
```

**檢查：** 剛好 5 顆胚珠、排成一直排、各有短珠柄接在左壁胎座上；每顆的珠孔（小缺口）清楚、朝左、靠近珠柄；胚囊是空的；左壁胎座那一面平整連續；花柱中間有細管；沒有花粉、花粉管、字。

## 圖回來後我要做的事

1. 備份原圖到 `local-backups/`，用 `cut_plants_1022.py` 去背（輸出取代 `ovary_multi.png`；`plants_kit_1022_v1.js` 的 `SIZE` 表更新尺寸）。
2. 重新量位置（胚珠中心、珠孔尖、珠柄接點、胎座表面），改 `plants_draw_multi_1022_v1.js` 的 `OVC/ORX/ORY/NUB`、鏡頭 `CAM`、果實著色（`fruitCanvas`）與花粉管路徑（胎座表面→珠柄→珠孔，不再繞過胚珠）。動畫由 Opus 做。
3. `sources.md` 補一筆 OV5。
