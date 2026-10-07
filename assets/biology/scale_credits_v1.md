# 生命的尺度 V1｜圖片、科學來源與處理紀錄

核對：2026-10-06。本機未核准版，不上架。真圖與模型分開；沒有把鏡像／變形他人圖片冒稱 AI 原創。

## 新增真實照片

### 藍鯨

- 檔案：`assets/biology/photos/blue_whale_scale_v1.jpg`，原圖1000×667。
- 作者：NOAA Fisheries/Lisa Conger。
- 原始來源：[Blue-whale.jpg](https://commons.wikimedia.org/wiki/File:Blue-whale.jpg)，頁面指向 NOAA 原相片庫並有授權覆核。
- 授權：美國政府 NOAA 員工職務作品，公共領域；依上述來源頁保留作者，不暗示 NOAA 背書。
- 下載：`https://upload.wikimedia.org/wikipedia/commons/1/16/Blue-whale.jpg`。
- 未裁切、拉伸、鏡像或改色；只網頁等比顯示、觸控平移／縮放。
- 照片沒有整隻全長校正比例尺，**33 m 不是從照片量得**。
- SHA256：`75046286d1074f30ace678e51b8996cf65d07c817f9a6218d7798808ece4818e`。

### 大腸桿菌

- 檔案：`assets/biology/photos/ecoli_sem_scale_v1.jpg`，原圖2835×1927。
- 作者：CDC/Evangeline Sowers, Janice Carr。
- 原始來源：[Escherichia coli (SEM).jpg](https://commons.wikimedia.org/wiki/File:Escherichia_coli_(SEM).jpg)，CDC PHIL編號7138。
- 授權：CDC 員工職務政府作品，公共領域；逐張確認此檔，不把所有PHIL圖片一概當公共領域。
- 下載：`https://upload.wikimedia.org/wikipedia/commons/a/a6/Escherichia_coli_%28SEM%29.jpg`。
- 未裁切／改色／變形，原12800×儀器資訊與2 μm比例尺完整保留。灰階為SEM，不宣稱細菌自然是灰色。
- 此檔作電子成像示例，**不聲稱整體約2 μm細菌只能用電子顯微鏡看**。
- SHA256：`851cce90f30e190cd8be612d847343f0a85b8e22a4b64e4945712f982c0cbed4`。
- 原來源站PHIL在網頁工具不可讀；Commons原始來源、作者、PD-US-HHS-CDC授權與API metadata已核對留存，沒有以站點不可讀掩蓋授權未知。

## 延用真圖（未修改）

- `paramecium_org_v1.jpg`：MTadey，[Paramécium caudátum](https://commons.wikimedia.org/wiki/File:Param%C3%A9cium_caud%C3%A1tum.jpg)，[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)。3264×2448、原圖未修改。光學實拍，200 μm為另一個模型比較例，不是從本圖校正量得。
- `elodea_clear_v2.jpg`：Juan Carlos Fonseca Mata，[水蘊草葉綠體](https://commons.wikimedia.org/wiki/File:Chloroplasts_-_Microscopic_view_of_Elodea_canadensis.jpg)，[CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)。沿用既有等比JPEG素材；此單元未另改檔。照片為光學實拍，未標示拍攝倍率；5 μm尺寸例不是本圖量測結果。
- 實拍圖每次切換皆顯示作者、來源、授權連結與處理說明。數位縮放不改取得倍率、不生成新細節；衍生顯示遵守原圖授權，圖像授權不混稱整站程式授權。
- 角色：正式 `assets/characters/xiaozhen/teaching.png`，88px青色圓框。

## 原創 AI 無字封面

- 作者／製作：Physical-Boys · 內建 imagegen；不用CLI，不輸入第三方參考圖。
- 網站檔：`assets/covers/biology_scale_cover_v1.png`，1536×1024。
- 原輸出：`/Users/lvyanjun/.codex/generated_images/01a04ddb-6e28-7263-a57d-c8cd7f95992c/exec-b0ea2ab7-c44c-4c70-b1d4-9d95a4b834d5.png`，原檔保留、僅複製入專案。
- SHA256：`42bf0f56428fa872a876b5c9e871b7aadec8e3443664b758a23cf93cba6dcf2f`。
- 已目視：藍鯨水平尾鰭、細長軀幹；顯微觀感的綠色單細胞概念合成，無字、數字、比例尺、Logo或浮水印。
- **非實拍、非實際顯微鏡觀測、非同尺度場景**，不供尺寸比較。完整提示詞另存 `scale_image_prompt_v1.md`。

## 科學核對與教學界線

- 老師第二章講義第1、13～17頁為範圍。黴漿菌0.1～0.3 μm取0.2作比較；大腸桿菌2 μm、身高172 cm、藍鯨33 m皆是講義尺度／換算例，不宣稱每個個體固定大小或現在平均身高。
- [BIPM SI prefixes](https://www.bipm.org/en/measurement-units/si-prefixes/)，核對km、cm、mm、μm、nm到公尺的十次方關係。
- [NOAA blue whale](https://www.fisheries.noaa.gov/species/blue-whale/science)，大型藍鯨可達約110英尺，支持講義33 m以上的尺度。照片中此個體並未量測。
- [The Cell：Chloroplasts and Other Plastids](https://www.ncbi.nlm.nih.gov/books/NBK9905/)，葉綠體約5～10 μm長；本模型取5 μm示例，照片沒有逐顆校正。
- [University of Utah Cell Size and Scale](https://learn.genetics.utah.edu/content/cells/scale/)，核對尺度視覺化、草履蟲與肉眼可見性需看條件等觀念。只學參數與即時尺規回饋，不複製圖、程式或文字；與[Javalab](https://javalab.org/en/cell_size_en/)比較互動設計，不增加講義未要求的表面積／體積比單元。
- [Nikon Nano-Scale Imaging](https://www.microscope.healthcare.nikon.com/en_AOM/applications/life-sciences/nano-scale-imaging)，一般光學橫向解析限制約200 nm。超解析技術不在此單元的普通光學模型範圍。
- 電子5 nm、肉眼0.1 mm為此處**兩點示意參考**，不是儀器性能保證；辨認外形還受製備、對比、光線、距離、觀察目的影響。點狀訊號能被偵測，不等於外形已可解析。
- 100 nm病毒為代表尺寸，不代表所有病毒相同；病毒不是細胞。沒有適合真圖的尺寸例只用尺規，不捏造真實照片。
- 講義原題保留提問與留白，不預填答案。碳原子7 nm疑似誤植原題留在待確認區，**不放進樣本尺寸或工具解析模型**。

授權metadata：`/private/tmp/biology_scale_sources_v1.json`，本機備份亦保存。原照片、提示詞、像素與雜湊、檢查程式和報告均留備份。
