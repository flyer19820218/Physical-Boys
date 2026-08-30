# Physical-Boys 化學儀器 SVG 母版

這套素材統一使用 `viewBox="0 0 240 240"`，透明背景，適合直接以 `<img>`、`<object>` 或 inline SVG 放進 1080px V5 教材。

## 使用定位

- 本套為**一般課堂講解、靜態裝置示意與 2.5D 視覺**使用的 SVG 儀器母版。
- 若教材需要旋轉視角、觀察前後空間、立體組裝或真正 3D 互動，必須另外使用專案既有的 Canvas／WebGL／Three.js 系統處理，不以本套 SVG 假裝真正 3D。
- 可將 SVG 外殼與 Canvas 動態效果混合使用；是否採真正 3D，以教學目的與既有單元技術為準。

## 視覺原則

- 玻璃：半透明青藍填色、白色高光、雙層輪廓與適度陰影。
- 金屬：冷灰漸層、明暗邊與小圓角，保持教學圖清楚但避免玩具感。
- 比例：依實際教室器材採細長管身、較薄配件與較硬朗輪廓；不把本來應為寬面的天秤、稱量紙與陶瓷纖維網強行拉長。
- 燒杯：固定保留右側尖脣，讓倒液方向與玻棒引流教學清楚可見。
- 尺度：主輪廓約 3～3.5px、次輪廓約 2～2.5px；縮小後仍可辨識。
- 背景：全部真正透明，不內嵌黑板或白底。
- 文字：器材本體不放名稱；雙語標籤留在 HTML 文字層。

## 動態分工

- SVG：器材外殼、玻璃厚度、高光、刻度、夾具與支架。
- Canvas／SVG 遮罩：液面升降、倒液、滴液、溫度柱、滴定讀數。
- Canvas／CSS：三角架、氣泡、沉澱、煙霧、火焰與反應特效。

三角架不納入固定 SVG 母版；依各實驗的酒精燈位置、透視角度與裝置比例，直接由 Canvas 繪製。

玻璃容器內提供命名的 `clipPath`，inline SVG 時可用於裁切液體層。正式教材替換既有 Canvas 前，仍須依 `AGENTS.md` 取得指定範圍授權。

## 檔案

- `beaker.svg`：燒杯
- `erlenmeyer-flask.svg`：錐形瓶
- `funnel.svg`：漏斗
- `thistle-funnel.svg`：薊頭漏斗
- `dropper.svg`：滴管
- `burette.svg`：滴定管
- `glass-rod.svg`：玻棒
- `weighing-paper.svg`：稱量紙
- `electronic-balance.svg`：電子天秤
- `iron-clamp.svg`：鐵夾
- `combustion-spoon.svg`：燃燒匙
- `wide-mouth-bottle.svg`：廣口瓶
- `thermometer.svg`：溫度計
- `ceramic-wire-gauze.svg`：陶瓷纖維網
- `alcohol-lamp.svg`：酒精燈（本體不含火焰，供三角架下方分層組合）
