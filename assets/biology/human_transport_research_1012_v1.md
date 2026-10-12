# 人體的運輸：教學文字與科學證據旁路

整合更新（2026-10-13）：本文保留科學查核與旁路交接時的歷史紀錄；後續正式接線、模型重繪、授權素材與驗證結果見 [整合修訂紀錄](human_transport_revision_1013_v1.md)。下文的「未嵌入／未推送」描述旁路完成時的狀態，不代表正式整合後的狀態。

查核日期：2026-10-12。範圍為 `human` 單元；完整讀取根目錄 AGENTS.md（1213 行）、原始 `human_transport_1008_v1.js`（821 行）、LivingBook metadata 契約及原圖來源紀錄。只新增本檔與 `human_transport_teaching_1012_v1.js`；未改既有 JS、HTML、framework，未 commit／push。老師的動畫重做授權由 main 執行，本旁路不實作動畫。

## 給 main 的接口

載入文字旁路後，在 main 的註冊攔截器中使用：

```js
const teachingSpec = window.HumanTransportTeaching.apply(spec);
// 將 teachingSpec 交給原有 register；旁路本身不呼叫或覆寫 register。
```

- 僅 `spec.id === 'human'` 生效；其他單元及未知 tab 原樣返回。
- 返回新的 spec／已知 tab 物件，不修改傳入的 spec，也不呼叫 `init`。
- 頁首只改 `title`、`subtitle`。tab 只改 `title/sub/hook/body/closure/reading/explain` 的文字層；保留 tab ID、數量、順序。
- `draw/act/controls/init/check/sources` 等原參照全部保留；不改狀態、答案、數值、計時、聲音或圖形。
- `heart/circulation/experiment` 的 explain wrapper 每次只呼叫原函式一次，保留原 title、動態 text 及其他欄位，再附與當前模式相關的短說明。循環的組織／肺交換窗、實驗魚尾模式不附不相干的文字。
- 淋巴 explain 不加入進階機制，只精準替換原本爭議段落；其他選項解說保留。此處依老師後續明確核准：「改成課本主線，拿掉直接回流支線」。main 另在舊 `lymphDraw` 刪支線；文字旁路不能替代該繪圖修正。
- 原 reading 與提問保留；心音、器官支路、脈波補充各附在對應 reading 末尾。淋巴 reading 只替換已核准的那一段，保留原本淋巴結、防禦、脂質運輸、單向回流等科學內容。
- 同一 input 重複 apply 不重複加字；對 output 再 apply 也不重複包裝。
- `HumanTransportTeaching.copy[tabId]` 提供 `heading/caption/modelNote` 等字典，供 main 的新教學台文字層使用。它們不會被旁路塞入畫布、控制列或來源 UI。需要科學來源的 main 可讀 `.sources`；原 `scienceSources` 完整保留。
- 所有字串沿用 `[繁體中文, simple English]`；第 0 項為中文。旁路沒有語言狀態，也不更動 framework 的中文預設。

### 精簡標題

| tab ID | 主標題（Hook） | 副標題（學科） | 教學台小標題 |
|---|---|---|---|
| heart | 咚咚，算幾次？ | 心臟與瓣膜 | 瓣膜怎麼守住流向？ |
| vessels | 動脈一定富氧？ | 三種血管 | 流向決定血管名稱 |
| blood | 誰送氧？誰止血？ | 血液成分 | 一管血，各有分工 |
| circulation | 全身怎麼送到？ | 體循環與肺循環 | 分送各處，再回心臟 |
| lymph | 組織液怎麼回來？ | 組織液與淋巴 | 從細胞間，回到靜脈 |
| experiment | 摸到的是什麼？ | 心音、脈搏與血流 | 聽心音，摸脈搏 |

頁首為「人體的運輸」＋一句導讀，不顯示 4-3 等章節編號。heading 是供 main 使用的字典，不擅改 framework。模型身分放圖旁小注／來源，不把「非實測、比例不符、非錄音」堆成主標題；仍需清楚區分模型、實拍、合成聲音及使用者的真實紀錄。

## 心音與瓣膜同步

第一心音 S1 對應房室瓣關閉，第二心音 S2 對應半月瓣關閉；一組 S1＋S2 算一次心搏。這是國中層級的事件對照，不把瓣膜開啟當作心音來源。[NIH／NHLBI：How the Heart Beats](https://www.nhlbi.nih.gov/health/heart/heart-beats)

main 的同步驗收建議：

1. S1 放在心室收縮開始、房室瓣關閉時；不要晚到已經射血才觸發。
2. 房室瓣關閉後，心室壓力尚未高於動脈壓前，半月瓣仍關；不要把 S1 畫成四瓣同時切換。
3. S2 放在射血結束、半月瓣關閉、心室轉為舒張時。隨後房室瓣才重新開啟充血。
4. 單一周期只計一組心音；暫停、手動切階段、重播及切語言時避免重複排音。合成心音標成教學聲音，不冒充錄音；圖片／影片也不能冒充真實觀察。

心腔、瓣膜位置及血流依 NIH 自身官方教材核對。[NHLBI：How Blood Flows through the Heart](https://www.nhlbi.nih.gov/health/heart/blood-flow)、[NCI SEER：Structure of the Heart](https://training.seer.cancer.gov/anatomy/cardiovascular/heart/structure.html)

## 體循環、肺循環與器官支路

老師指定的完整主線：

**左心室 → 主動脈及其各器官支路 → 器官微血管 → 靜脈匯流 → 上／下大靜脈 → 右心房 → 右心室 → 肺動脈 → 肺微血管 → 肺靜脈 → 左心房 → 左心室。**

「各器官支路」指多數器官分別接受供血，不是一顆紅血球必須逐一經過所有器官，也不是全部血液先過肝或腎。兩個循環在活體中持續相接；示意追蹤的一顆血球一次選一條器官路徑。[NHLBI 血流主線](https://www.nhlbi.nih.gov/health/heart/blood-flow)

肝門靜脈是消化道回流至肝的靜脈路線，不是主動脈分支。小腸微血管 → 肝門靜脈 → 肝 → 肝靜脈 → 下大靜脈；肝另有肝動脈供血。肝門路徑是兩組微血管間的特殊串接，不能因此把所有器官支路串成一列。[NCI SEER：Accessory Organs](https://training.seer.cancer.gov/anatomy/digestive/regions/accessory.html)

心肌也需要供血：主動脈 → 冠狀動脈 → 心肌微血管 → 冠狀靜脈 → 右心房；多數冠狀靜脈經冠狀竇回右心房。不要把「心肌供血」誤接成血液穿出心室，或把全部冠狀靜脈都強制接上大靜脈。[NCI SEER：Structure of the Heart](https://training.seer.cancer.gov/anatomy/cardiovascular/heart/structure.html)

富氧血用鮮紅，少氧血用暗紅；「少氧」不等於「完全沒有氧」。肺動脈少氧、肺靜脈富氧；動靜脈按離心／回心命名。WHO 的原始訓練教材也採富氧鮮紅、少氧暗紅，不能把官方某張解剖圖的藍色路徑當成血液本色。[WHO：Using Pulse Oximeters, Tutorial 1 – the basics](https://cdn.who.int/media/docs/default-source/patient-safety/pulse-oximetry/who-ps-pulse-oxymetry-tutorial1-the-basics-en.pdf?sfvrsn=975b7dc8_8)、[NCI SEER：Classification & Structure of Blood Vessels](https://training.seer.cancer.gov/anatomy/cardiovascular/blood/classification.html)。WHO 該檔列 © 2011、all rights reserved；本次只引用科學內容與連結，未重製其圖像。

原色碼 `rich: #ef3e46`、`poor: #76232f` 已符合鮮紅／暗紅。大剖面可增密血球，但保留「教學示意／不是血球檢驗值」小注；不能按模型粒子數倒推個人血球比例。

老師保存的參考圖 `references/teacher_circulation_ai_original_1012_v1.png` 及同名 MD：來源是老師提供的 AI 截圖，原生成工具／作者／授權未提供，原樣保留；未重製、未去背、未拿它假稱本代理原創。main 應用它理解老師希望的分支構圖，再用已核對的解剖與路線做教材；公開重製其圖形前仍須確認權利條件。

## 脈搏：管壁的波，與血球流動分開

main 的末頁動畫應呈現局部動脈壁隨壓力波到達而依序擴張、回復；波與血球是兩件事。追蹤同一顆紅球通過手腕，不能代替脈波。壁形上下須對稱展開，血球可以同時流動，但不能用血球抵達時刻定義脈搏。

原始研究：Madalina Negoita、Alun D. Hughes、Kim H. Parker、Ashraf W. Khir，2018，*A method for determining local pulse wave velocity in human ascending aorta from sequential ultrasound measurements of diameter and velocity*，*Physiological Measurement* 39:114009，[DOI 10.1088/1361-6579/aae8a0](https://doi.org/10.1088/1361-6579/aae8a0)，[作者機構 UCL 保存的論文](https://discovery.ucl.ac.uk/10064559/1/Negoita_2018_Physiol._Meas._39_114009.pdf)。

研究以 10 名健康成人的升主動脈超音波分別測量管徑波形與血流速度；管壁影像提供真實管徑隨心搏改變的證據。這支持區分血液流動和脈波，不能把該組樣本的數值直接設成所有學生的脈波速率。文章原始內容明列 **CC BY 3.0**；若 main 使用圖 2 的壁追蹤實測影像，須附四位作者、題名、期刊、DOI、[授權連結](https://creativecommons.org/licenses/by/3.0/)與改作說明。本次僅研究引用，未下載／改作該圖。

脈搏觸摸部位與食指／中指的教學依 [NHLBI 心搏與脈搏說明](https://www.nhlbi.nih.gov/health/heart/heart-beats)。仍保留老師既有「整分鐘計數」流程與所有紀錄；示意壁波與合成心音不得自動填入使用者量測。

## 淋巴：原書證據與授權更新

### 原頁核對結果

核對 `/Users/lvyanjun/Downloads/703.pdf` 的 PDF 第 23–24 頁（印刷 108–109 頁），讀文字並逐頁渲染、目視原頁；無修改原 PDF。原書有教師旁欄及教學建議，不能只靠文字擷取決定哪些是學生課文。

- 印刷第 108 頁學生正文「淋巴的形成與循環」：血漿部分物質滲到組織細胞間 → 組織液 → 進入淋巴管稱淋巴 → 注入靜脈。
- 第 108 頁圖 3-24「淋巴的形成與循環」同樣畫上述路線，沒有直接回微血管的支線。
- 第 109 頁圖 3-23C 組織液的箭頭朝淋巴管；圖 3-23D 把淋巴回程接往靜脈。
- **但第 108 頁底部教師區「給老師／提問 B」確實提到有些回到微血管、部分進淋巴循環。** 因此不能說整份教師版完全沒有這個說法。它不等於學生主課文的重點，原先「依課本」未區分來源層級。
- 原 `CONTENT[4].paragraphs[2]`（id `lymph`；原排列第 5 頁，不應以含糊的「第 4 tab」硬定位）把該補充當成主教材說明；同段也流入 `LYMPH_EXPLAIN.tissue`。原 `lymphDraw` 實作 `direct/viaBlood` 支線，`check.bothReturnPaths` 為 true。修改時需 main 同時核對這項 check，不讓新圖和舊宣稱相矛盾。

既有 `used_sources_1008_v1.json` 的 human `lymph` 條目只指 `lymph_body.png`、第 108 頁圖 3-23A（全身淋巴圖），不足以獨立支持跨微血管回流的機制。`chapter4_plan_1008_v1.md` 第 122 行也規劃過兩條回收路徑，但它是本專案設計紀錄，不是另一份課本證據。

原 PDF SHA-256（metadata）：`0e006fbf380830d7f66704c1fbc45813695fd9cdb15500820ed168da94db2865`。原圖不是開放授權：既有紀錄稱老師於 2026-10-08 回報取得康軒使用同意；作者、版次仍待原書證據，不自行杜撰。所有既有素材、來源及資料保留。

### 已核准的教材處理

老師後續明確核准：「改成課本主線，拿掉直接回流支線」。本旁路因此將 reading 中那一句完整的「依課本的簡化模型…」以及它在組織液 caption 的對應內容，精準換成 **血漿 → 組織液 → 淋巴管內的淋巴 → 靜脈**。

不加入「全部組織液永遠只能…」「任何組織都不可能回微血管」等全稱語句。不在主教材塞 revised Starling、糖萼、暫時回吸等進階機制。淋巴結、防禦、脂質運輸、正常紅血球留在管內等既有內容保留。原書教師補充的存在與當代生理界線留在這份研究文件，供老師／main 查核。

### 進階研究證據（只供教師／main，不進主教材）

1. **原始研究**：C. C. Michel、M. E. Phillips（1987），*Steady-state fluid filtration at different capillary pressures in perfused frog mesenteric capillaries*，*J Physiol* 388:421–435，[DOI](https://doi.org/10.1113/jphysiol.1987.sp016622)、[NIH PubMed](https://pubmed.ncbi.nlm.nih.gov/3498833/)、[PMC1192556](https://pmc.ncbi.nlm.nih.gov/articles/PMC1192556/)。15 條蛙腸系膜微血管的控制灌流：降低壓力後可見暫時回吸，維持至少 2 分鐘的穩態則呈微小濾出或小到無法測得的淨流量。這是特定動物／灌流條件，不直接等於所有人類組織。
2. **原始研究**：R. H. Adamson、J. F. Lenz、X. Zhang、G. N. Adamson、S. Weinbaum、F. E. Curry（2004），*Oncotic pressures opposing filtration across non-fenestrated rat microvessels*，*J Physiol* 557:889–907，[出版者原文／DOI](https://doi.org/10.1113/jphysiol.2003.058255)、[NIH PMC1665140](https://pmc.ncbi.nlm.nih.gov/articles/PMC1665140/)。實驗在大鼠腸系膜非窗孔小靜脈進行，結合灌流、共軛焦與電顯，支持糖萼及其局部蛋白濃度差影響濾過；不是直接測遍人體所有微血管。
3. **綜述，與原始實驗分列**：J. Rodney Levick、C. Charles Michel（2010），*Microvascular fluid exchange and the revised Starling principle*，*Cardiovascular Research* 87:198–210，[原出版者 DOI](https://doi.org/10.1093/cvr/cvq062)。多數組織穩態的微血管淨流量仍偏少量濾出，組織液平衡主要依賴淋巴；某些特殊區域如腎臟、腸黏膜有持續吸收條件。不能把「多數／穩態／淨流量」改寫成「每一分子、每一組織、每一時刻都不會回入血管」。

以上研究只摘要並提供連結；未重製論文圖表，PMC 收錄本身不表示公共領域。2010 綜述頁列作者版權／保留權利；1987／2004 未將可讀全文誤標成 CC 或公共領域。部分 PMC 直接 open 返回瀏覽器驗證頁；以 NIH 已索引的原研究摘要及出版者原文交叉核對，沒有假稱已無阻讀完全文。

原教材來源中 [OpenStax Capillary Exchange](https://openstax.org/books/anatomy-and-physiology-2e/pages/20-3-capillary-exchange) 仍呈現傳統的濾出／靜脈端回吸教法，但它是另一套教材，不能用它證明康軒學生正文教了同一段，也不能當作 revised Starling 的原始研究。保留既有來源清單，不拿不同教材互相冒名。此次讀取頁面列 [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/) 及額外使用條件；未把目前頁面誤標成不含 NC 的 CC BY，未重製其圖文。

## 可合法使用的瓣膜動畫候選

本次只記錄候選，**未下載、未嵌入、未轉檔、未配音**。以下兩個是同一原作者模型的不同媒體版本，並非兩份獨立科學證據；授權核對不等於已完成逐格解剖／心音同步驗證。

| 候選 | 作者／來源 | 核對到的授權 | main 的用途與注意 |
|---|---|---|---|
| [CG Heart.gif](https://commons.wikimedia.org/wiki/File:CG_Heart.gif) | DrJanaOfficial；2016 電腦生成心臟剖面；Commons 原檔連結可下載 | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)；頁有 VRT 許可核對，ticket 2018071010003673 | 800×600、29 frames、循環約 0.9 秒；供觀察瓣膜運動。是 CG 模型，不能標成超音波／實拍。需檢查可見瓣膜及每周期邊界，再決定配音。 |
| [CG heart 90fps.webm](https://commons.wikimedia.org/wiki/File:CG_heart_90fps.webm) | DrJanaOfficial 原模型；Alexis Jazz 上傳衍生媒體，來源頁指回 CG Heart.gif 早期高解析版本 | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)；同一 VRT 許可核對 | 570×678、約 29 秒；WebM 可控制播放時間，體積約 57.5 MB；這 29 秒不是一次心搏。下載／轉 MP4 後須如實記錄轉檔與速度處理。 |

採用時頁面署名至少寫「DrJanaOfficial, CG Heart（對應版本）, Wikimedia Commons, CC BY-SA 4.0」，附作品及授權連結。若使用第二個版本也註記 Alexis Jazz 衍生媒體來源；裁切、重編碼、降速、配字幕／音效都明列處理，衍生素材遵循相同或相容授權。別把圖像 SA 授權寫成整站程式授權。只使用原檔說明頁已授權的媒體，不能把頁面另連的付費 3D 模型當成同一授權。

NIH 的 [How the Heart Beats](https://www.nhlbi.nih.gov/health/heart/heart-beats) 及 [Heart Valve Diseases](https://www.nhlbi.nih.gov/health/heart-valve-diseases) 網頁動畫明列 **© Nucleus Medical Media, all rights reserved**。可引用頁面作科學來源，不因位於 nih.gov 就將影片當公共領域下載、去標誌或重製。未查得允許本專案再嵌入／下載的條件，故不推薦將它直接當本站素材；若 main 想用，需有 Nucleus 對該用途的許可。

## 驗證與交接限制

- `node --check` 通過。
- 以原模組在 VM 註冊取得真實 spec，再跑 85 組心腔／心搏階段、循環站點／模式、淋巴區室、實驗階段／模式的解說檢查，全部通過。
- 原 spec 不變、非 human 不變、未知 tab 不變；apply 可重複而不累加。wrapper 保留 this／參數、原 explain 只呼叫一次、原結果物件未被修改。
- 六頁 `draw/controls/act/init/check/sources` 與原 spec 同一參照；原 `scienceSources` 同一參照。淋巴只有已核准段落替換，防禦與小腸脂質等原文仍在。
- 本旁路未改 Canvas 或 CSS；未接入正式 HTML，故不聲稱新動畫同步、像素變化、iPad 排版或字體載入已完成驗收。main 接線後仍須實測中英文、字體、畫布與心音。

既有檔案工作前後 SHA-256 相同：

| 檔案 | SHA-256 |
|---|---|
| human_transport_1008_v1.js | `ad5e094256c192b60c1c860cd28f5593f44e2203e82c30792206772fffcbbc5e` |
| living_book_1008_v1.js | `97293e70c02e887a65de984f0dd235319df3486ca347f15a513736781b13c0cc` |
| biology_human_transport.html | `7ca442745f1dd1cff10ee9c53adce8f4a9588d076792696ceeed156749f06386` |

此校驗是本旁路完成時的結果；main 後續依授權修改舊圖與支線後，應另外記錄自身差異，不能沿用這三個 hash 宣稱整個整合結果未修改原檔。
